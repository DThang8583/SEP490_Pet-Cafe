import React from 'react';
import { Typography, Stack, Grid, Chip, alpha } from '@mui/material';
import { AttachMoney, ShoppingCart, TrendingUp, TrendingDown, People, EventAvailable, Payment, Groups, PersonAdd, TaskAlt, Inventory2, Insights } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { SectionContainer, SummaryGrid, CardSection, formatCurrency, formatNumber, SimpleBarChart, PieChartComponent, LineChartComponent } from './DashboardUtils';

// ========== OVERVIEW SECTION ==========
export const OverviewSection = ({ overviewStats }) => {
    if (!overviewStats) return null;

    return (
        <SectionContainer title="Tổng quan nhanh" color={COLORS.PRIMARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Doanh thu hôm nay',
                        value: formatCurrency(overviewStats.revenue?.today || 0),
                        caption: `Tuần: ${formatCurrency(overviewStats.revenue?.this_week || 0)} · Tháng: ${formatCurrency(overviewStats.revenue?.this_month || 0)} · Năm: ${formatCurrency(overviewStats.revenue?.this_year || 0)}`,
                        color: COLORS.SUCCESS[500],
                        icon: <AttachMoney fontSize="medium" />
                    },
                    {
                        label: 'Đơn hàng hôm nay',
                        value: formatNumber(overviewStats.orders?.today || 0),
                        caption: `Tuần: ${formatNumber(overviewStats.orders?.this_week || 0)} · Tháng: ${formatNumber(overviewStats.orders?.this_month || 0)} · Tỷ lệ thành công: ${(overviewStats.orders?.success_rate ?? 0).toFixed(1)}%`,
                        color: COLORS.PRIMARY[500],
                        icon: <ShoppingCart fontSize="medium" />
                    },
                    {
                        label: 'Thanh toán thành công',
                        value: formatNumber(overviewStats.payment?.successful_payments || 0),
                        caption: `Tỷ lệ: ${(overviewStats.payment?.success_rate ?? 0).toFixed(1)}% · Thất bại: ${formatNumber(overviewStats.payment?.failed_payments || 0)}`,
                        color: COLORS.SECONDARY[500],
                        icon: <Payment fontSize="medium" />
                    },
                    {
                        label: 'Booking hoàn thành',
                        value: formatNumber(overviewStats.bookings?.completed || 0),
                        caption: `Hôm nay: ${formatNumber(overviewStats.bookings?.today || 0)} · Tuần: ${formatNumber(overviewStats.bookings?.this_week || 0)} · Tháng: ${formatNumber(overviewStats.bookings?.this_month || 0)} · Đang chờ: ${formatNumber(overviewStats.bookings?.pending || 0)}`,
                        color: COLORS.WARNING[500],
                        icon: <EventAvailable fontSize="medium" />
                    },
                    {
                        label: 'Khách hàng',
                        value: formatNumber(overviewStats.customers?.total || 0),
                        caption: `Hôm nay: ${formatNumber(overviewStats.customers?.new_today || 0)} · Tuần: ${formatNumber(overviewStats.customers?.new_this_week || 0)} · Tháng: ${formatNumber(overviewStats.customers?.new_this_month || 0)}`,
                        color: COLORS.PRIMARY[400],
                        icon: <PersonAdd fontSize="medium" />
                    },
                    {
                        label: 'Task',
                        value: formatNumber(overviewStats.tasks?.completed || 0),
                        caption: `Hoàn thành: ${formatNumber(overviewStats.tasks?.completed || 0)} · Đang chờ: ${formatNumber(overviewStats.tasks?.pending || 0)} · Đang xử lý: ${formatNumber(overviewStats.tasks?.in_progress || 0)} · Tỷ lệ: ${(overviewStats.tasks?.completion_rate ?? 0).toFixed(1)}%`,
                        color: COLORS.INFO[500],
                        icon: <TaskAlt fontSize="medium" />
                    },
                    {
                        label: 'Nhân viên làm việc',
                        value: formatNumber(overviewStats.employees?.working_today || 0),
                        caption: `Đang hoạt động: ${formatNumber(overviewStats.employees?.active || 0)}`,
                        color: COLORS.SECONDARY[500],
                        icon: <Groups fontSize="medium" />
                    }
                ]}
            />
        </SectionContainer>
    );
};

// ========== TASKS SECTION ==========
export const TasksSection = ({ tasksData }) => {
    if (!tasksData) return null;

    return (
        <SectionContainer title="Thống kê Nhiệm vụ" color={COLORS.INFO[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số nhiệm vụ',
                        value: formatNumber(tasksData.total_tasks || 0),
                        caption: 'Tổng khối lượng công việc hiện tại',
                        color: COLORS.INFO[500],
                        icon: <Insights fontSize="medium" />
                    },
                    {
                        label: 'Tỷ lệ hoàn thành',
                        value: `${(tasksData.completion_rate ?? 0).toFixed(1)}%`,
                        caption: 'Hiệu quả xử lý nhiệm vụ',
                        color: COLORS.SUCCESS[500],
                        icon: <TaskAlt fontSize="medium" />
                    },
                    {
                        label: 'Nhiệm vụ công khai',
                        value: formatNumber(tasksData.task_public_private?.public_tasks || 0),
                        caption: 'Công việc chia sẻ toàn hệ thống',
                        color: COLORS.PRIMARY[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Nhiệm vụ nội bộ',
                        value: formatNumber(tasksData.task_public_private?.private_tasks || 0),
                        caption: 'Công việc nội bộ, bảo mật',
                        color: COLORS.SECONDARY[500],
                        icon: <TrendingDown fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Nhiệm vụ theo trạng thái"
                color={COLORS.INFO[600]}
                hasData={Boolean(tasksData.tasks_by_status?.length)}
                emptyMessage="Chưa có dữ liệu nhiệm vụ theo trạng thái."
            >
                <PieChartComponent
                    data={tasksData.tasks_by_status?.map(item => ({
                        ...item,
                        name: item.status === 'ACTIVE' ? 'Đang hoạt động'
                            : item.status === 'COMPLETED' ? 'Đã hoàn thành'
                                : item.status === 'CANCELLED' ? 'Đã hủy'
                                    : item.status || 'Không xác định'
                    }))}
                    dataKey="count"
                    nameKey="name"
                    colors={[COLORS.INFO[500], COLORS.SUCCESS[500], COLORS.ERROR[500], COLORS.WARNING[500]]}
                />
            </CardSection>

            <CardSection
                title="Nhiệm vụ theo mức độ ưu tiên"
                color={COLORS.INFO[600]}
                hasData={Boolean(tasksData.tasks_by_priority?.length)}
                emptyMessage="Chưa có dữ liệu nhiệm vụ theo mức độ ưu tiên."
            >
                <PieChartComponent
                    data={tasksData.tasks_by_priority?.map(item => ({
                        ...item,
                        name: item.priority === 'HIGH' ? 'Cao'
                            : item.priority === 'MEDIUM' ? 'Trung bình'
                                : item.priority === 'LOW' ? 'Thấp'
                                    : item.priority || 'Không xác định'
                    }))}
                    dataKey="count"
                    nameKey="name"
                    colors={[COLORS.ERROR[500], COLORS.WARNING[500], COLORS.SUCCESS[500]]}
                />
            </CardSection>

            <CardSection
                title="Nhiệm vụ theo loại công việc"
                color={COLORS.INFO[600]}
                hasData={Boolean(tasksData.tasks_by_work_type?.length)}
                emptyMessage="Chưa có dữ liệu nhiệm vụ theo loại công việc."
            >
                <SimpleBarChart
                    data={tasksData.tasks_by_work_type}
                    dataKey="count"
                    xAxisKey="work_type_name"
                    fill={COLORS.INFO[500]}
                    name="Số lượng"
                    xAxisAngle={-45}
                    xAxisHeight={100}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== REVENUE SECTION ==========
export const RevenueSection = ({ revenueData }) => {
    if (!revenueData) return null;

    return (
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
                <LineChartComponent
                    data={revenueData.revenue_by_period}
                    dataKey="revenue"
                    xAxisKey="period"
                    name="Doanh thu"
                    stroke={COLORS.SUCCESS[500]}
                    formatter={formatCurrency}
                    xAxisAngle={-45}
                    showArea={true}
                    yAxisFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value;
                    }}
                />
            </CardSection>

            <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
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

                <Grid item xs={12} md={12}>
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

                <Grid item xs={12} md={12}>
                    <CardSection
                        title="Doanh thu theo loại đơn hàng"
                        color={COLORS.WARNING[600]}
                        hasData={Boolean(revenueData.revenue_by_order_type?.length)}
                        emptyMessage="Chưa có dữ liệu theo loại đơn hàng"
                    >
                        <Stack spacing={1.5}>
                            {revenueData.revenue_by_order_type?.map((item, index) => (
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
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {item.order_type || 'Không xác định'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                        {formatCurrency(item.revenue || 0)}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </CardSection>
                </Grid>
            </Grid>
        </SectionContainer>
    );
};

// ========== ORDERS SECTION ==========
export const OrdersSection = ({ ordersData }) => {
    if (!ordersData) return null;

    return (
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
                <LineChartComponent
                    data={ordersData.orders_by_period}
                    dataKey="count"
                    xAxisKey="period"
                    name="Số lượng đơn"
                    stroke={COLORS.PRIMARY[500]}
                    xAxisAngle={-45}
                    showArea={true}
                />
            </CardSection>

            <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
                    <CardSection
                        title="Đơn hàng theo trạng thái"
                        color={COLORS.PRIMARY[600]}
                        hasData={Boolean(ordersData.orders_by_status?.length)}
                        emptyMessage="Chưa có dữ liệu trạng thái đơn hàng"
                    >
                        <PieChartComponent
                            data={ordersData.orders_by_status?.map(item => ({
                                ...item,
                                name: item.status === 'PAID' ? 'Đã thanh toán'
                                    : item.status === 'PENDING' ? 'Đang chờ'
                                        : item.status === 'CANCELLED' ? 'Đã hủy'
                                            : item.status === 'REFUNDED' ? 'Đã hoàn tiền'
                                                : item.status || 'Không xác định'
                            }))}
                            dataKey="count"
                            nameKey="name"
                            colors={[COLORS.SUCCESS[500], COLORS.WARNING[500], COLORS.ERROR[500], COLORS.INFO[500]]}
                        />
                    </CardSection>
                </Grid>

                <Grid item xs={12} md={12}>
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
    );
};

// ========== PRODUCTS SECTION ==========
export const ProductsSection = ({ productsData }) => {
    if (!productsData) return null;

    // Calculate total products from available data
    // Combine unique product IDs from all arrays
    const allProductIds = new Set();
    if (productsData.top_selling_by_quantity) {
        productsData.top_selling_by_quantity.forEach(p => p.product_id && allProductIds.add(p.product_id));
    }
    if (productsData.top_selling_by_revenue) {
        productsData.top_selling_by_revenue.forEach(p => p.product_id && allProductIds.add(p.product_id));
    }
    if (productsData.low_stock_products) {
        productsData.low_stock_products.forEach(p => p.product_id && allProductIds.add(p.product_id));
    }
    if (productsData.no_sales_products) {
        productsData.no_sales_products.forEach(p => p.product_id && allProductIds.add(p.product_id));
    }
    const calculatedTotalProducts = productsData.total_products || allProductIds.size;

    return (
        <SectionContainer title="Thống kê Sản phẩm" color={COLORS.WARNING[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số sản phẩm',
                        value: formatNumber(calculatedTotalProducts),
                        caption: 'Số lượng mặt hàng đang kinh doanh',
                        color: COLORS.WARNING[500],
                        icon: <Inventory2 fontSize="medium" />
                    },
                    {
                        label: 'Giá trị tổng sản phẩm',
                        value: formatCurrency(productsData.total_inventory_value || 0),
                        caption: 'Tổng giá trị sản phẩm hiện tại',
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
                        label: 'Sản phẩm bán chậm',
                        value: formatNumber(productsData.no_sales_products?.length || 0),
                        caption: 'Chưa ghi nhận doanh thu',
                        color: COLORS.PRIMARY[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Top sản phẩm bán chạy (số lượng)"
                color={COLORS.WARNING[600]}
                hasData={Boolean(productsData.top_selling_by_quantity?.length)}
                emptyMessage="Chưa có dữ liệu top sản phẩm theo số lượng."
            >
                <SimpleBarChart
                    data={productsData.top_selling_by_quantity}
                    dataKey="quantity"
                    xAxisKey="product_name"
                    fill={COLORS.WARNING[500]}
                    name="Số lượng"
                    xAxisAngle={-45}
                    xAxisHeight={100}
                />
            </CardSection>

            <CardSection
                title="Top sản phẩm bán chạy (doanh thu)"
                color={COLORS.SUCCESS[600]}
                hasData={Boolean(productsData.top_selling_by_revenue?.length)}
                emptyMessage="Chưa có dữ liệu top sản phẩm theo doanh thu."
            >
                <SimpleBarChart
                    data={productsData.top_selling_by_revenue}
                    dataKey="revenue"
                    xAxisKey="product_name"
                    fill={COLORS.SUCCESS[500]}
                    name="Doanh thu"
                    formatter={formatCurrency}
                    xAxisAngle={-45}
                    xAxisHeight={100}
                    yAxisFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value;
                    }}
                />
            </CardSection>

            <CardSection
                title="Sản phẩm bán chậm"
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
    );
};

// ========== SERVICES SECTION ==========
export const ServicesSection = ({ servicesData }) => {
    if (!servicesData) return null;

    return (
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
                <LineChartComponent
                    data={servicesData.bookings_by_period}
                    dataKey="count"
                    xAxisKey="period"
                    name="Số lượng booking"
                    stroke={COLORS.INFO[500]}
                    xAxisAngle={-45}
                    showArea={true}
                />
            </CardSection>

            <CardSection
                title="Booking theo trạng thái"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(servicesData.bookings_by_status?.length)}
                emptyMessage="Chưa có dữ liệu booking theo trạng thái."
            >
                <PieChartComponent
                    data={servicesData.bookings_by_status?.map(item => ({
                        ...item,
                        name: item.status === 'COMPLETED' ? 'Đã hoàn thành'
                            : item.status === 'PENDING' ? 'Đang chờ'
                                : item.status === 'CANCELLED' ? 'Đã hủy'
                                    : item.status === 'CONFIRMED' ? 'Đã xác nhận'
                                        : item.status || 'Không xác định'
                    }))}
                    dataKey="count"
                    nameKey="name"
                    colors={[COLORS.SUCCESS[500], COLORS.WARNING[500], COLORS.ERROR[500], COLORS.INFO[500]]}
                />
            </CardSection>

            <CardSection
                title="Top dịch vụ phổ biến"
                color={COLORS.INFO[600]}
                hasData={Boolean(servicesData.top_services?.length)}
                emptyMessage="Chưa có dữ liệu các dịch vụ phổ biến."
            >
                <SimpleBarChart
                    data={servicesData.top_services}
                    dataKey="booking_count"
                    xAxisKey="service_name"
                    fill={COLORS.INFO[500]}
                    name="Số lượng booking"
                    xAxisAngle={-45}
                    xAxisHeight={100}
                />
            </CardSection>

            <CardSection
                title="Doanh thu theo dịch vụ"
                color={COLORS.SUCCESS[600]}
                hasData={Boolean(servicesData.service_revenues?.length)}
                emptyMessage="Chưa có dữ liệu doanh thu dịch vụ."
            >
                <SimpleBarChart
                    data={servicesData.service_revenues}
                    dataKey="revenue"
                    xAxisKey="service_name"
                    fill={COLORS.SUCCESS[500]}
                    name="Doanh thu"
                    formatter={formatCurrency}
                    xAxisAngle={-45}
                    xAxisHeight={100}
                    yAxisFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value;
                    }}
                />
            </CardSection>
        </SectionContainer>
    );
};

