import React from 'react';
import { Box, Typography, Stack, Paper, Card, CardContent, alpha } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { COLORS } from '../../../constants/colors';

// ========== CONSTANTS ==========

const MUI_SPACING_UNIT = 8; // MUI spacing unit in pixels
const DEFAULT_CHART_HEIGHT = 450;
const DEFAULT_X_AXIS_HEIGHT = 80;

// ========== FORMATTING UTILITIES ==========

const isValidNumber = (value) => value !== null && value !== undefined && value !== '';

export const formatCurrency = (value) => {
    if (!isValidNumber(value)) return '0';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

export const formatNumber = (value) => {
    if (!isValidNumber(value)) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
};

export const formatMonthLabel = (monthString) => {
    if (!monthString) return '—';
    try {
        const [year, month] = monthString.split('-');
        return `${month.padStart(2, '0')}/${year}`;
    } catch (error) {
        return monthString;
    }
};

export const formatDateTime = (value) => {
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

// ========== REUSABLE COMPONENTS ==========

export const SectionContainer = ({ title, color = COLORS.PRIMARY[600], actions, children }) => (
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

export const EmptyState = ({ message }) => (
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

// Color mapping for SummaryCard value text
const COLOR_VALUE_MAP = {
    [COLORS.PRIMARY[500]]: COLORS.PRIMARY[700],
    [COLORS.SUCCESS[500]]: COLORS.SUCCESS[700],
    [COLORS.WARNING[500]]: COLORS.WARNING[700],
    [COLORS.ERROR[500]]: COLORS.ERROR[700],
    [COLORS.INFO[500]]: COLORS.INFO[700],
    [COLORS.SECONDARY[500]]: COLORS.SECONDARY[700],
    [COLORS.PRIMARY[400]]: COLORS.PRIMARY[600]
};

const getValueColor = (color) => COLOR_VALUE_MAP[color] || color;

export const SummaryCard = ({ label, value, caption, color = COLORS.PRIMARY[500] }) => {
    const valueColor = getValueColor(color);

    return (
        <Paper
            sx={{
                p: 2.5,
                borderTop: `4px solid ${color}`,
                borderRadius: 2,
                height: '100%',
                boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
            }}
        >
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {label}
            </Typography>
            <Typography variant="h4" fontWeight={600} color={valueColor}>
                {value}
            </Typography>
            {caption && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {caption}
                </Typography>
            )}
        </Paper>
    );
};

export const SummaryGrid = ({ items = [], spacing = 2 }) => {
    if (items.length === 0) return null;

    const gapValue = typeof spacing === 'number' ? spacing * MUI_SPACING_UNIT : 16;
    const totalGaps = (items.length - 1) * gapValue;
    const cardWidth = `calc((100% - ${totalGaps}px) / ${items.length})`;

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: spacing,
                mb: 4,
                width: '100%',
                overflow: 'visible'
            }}
        >
            {items.map((item, index) => (
                <Box
                    key={item.label || index}
                    sx={{
                        flex: `0 0 ${cardWidth}`,
                        width: cardWidth,
                        maxWidth: cardWidth,
                        minWidth: 0
                    }}
                >
                    <SummaryCard {...item} />
                </Box>
            ))}
        </Box>
    );
};

export const CardSection = ({ title, color = COLORS.PRIMARY[600], hasData = true, emptyMessage, children }) => (
    <Card sx={{ borderRadius: 3, boxShadow: '0px 18px 35px rgba(15, 23, 42, 0.08)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color, mb: 2 }}>
                {title}
            </Typography>
            {hasData ? children : <EmptyState message={emptyMessage} />}
        </CardContent>
    </Card>
);

// ========== CHART COMPONENTS ==========

const DEFAULT_TOOLTIP_STYLE = {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
    borderRadius: '8px'
};

const DEFAULT_CHART_MARGIN = { top: 20, right: 30, left: 20, bottom: 5 };
const DEFAULT_TICK_FONT_SIZE = 12;
const DEFAULT_BAR_RADIUS = [8, 8, 0, 0];

export const SimpleBarChart = ({
    data,
    dataKey,
    xAxisKey,
    fill,
    name,
    formatter = formatNumber,
    xAxisAngle = 0,
    xAxisHeight = DEFAULT_X_AXIS_HEIGHT,
    yAxisFormatter,
    height = DEFAULT_CHART_HEIGHT
}) => (
    <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={DEFAULT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: DEFAULT_TICK_FONT_SIZE }}
                angle={xAxisAngle}
                textAnchor={xAxisAngle !== 0 ? 'end' : 'middle'}
                height={xAxisHeight}
            />
            <YAxis
                tick={{ fontSize: DEFAULT_TICK_FONT_SIZE }}
                tickFormatter={yAxisFormatter}
            />
            <Tooltip
                formatter={formatter}
                contentStyle={DEFAULT_TOOLTIP_STYLE}
            />
            <Legend />
            <Bar
                dataKey={dataKey}
                fill={fill}
                name={name}
                radius={DEFAULT_BAR_RADIUS}
            />
        </BarChart>
    </ResponsiveContainer>
);

export const StackedBarChart = ({
    data,
    bars,
    xAxisKey,
    xAxisAngle = 0,
    xAxisHeight = DEFAULT_X_AXIS_HEIGHT,
    formatter = formatNumber,
    height = DEFAULT_CHART_HEIGHT
}) => (
    <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={DEFAULT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: DEFAULT_TICK_FONT_SIZE }}
                angle={xAxisAngle}
                textAnchor={xAxisAngle !== 0 ? 'end' : 'middle'}
                height={xAxisHeight}
            />
            <YAxis tick={{ fontSize: DEFAULT_TICK_FONT_SIZE }} />
            <Tooltip
                formatter={formatter}
                contentStyle={DEFAULT_TOOLTIP_STYLE}
            />
            <Legend />
            {bars.map((bar, index) => (
                <Bar
                    key={`${bar.dataKey}-${index}`}
                    dataKey={bar.dataKey}
                    stackId={bar.stackId || 'a'}
                    fill={bar.fill}
                    name={bar.name}
                />
            ))}
        </ComposedChart>
    </ResponsiveContainer>
);

export const PieChartComponent = ({
    data,
    dataKey = 'count',
    nameKey = 'name',
    colors = [COLORS.PRIMARY[500], COLORS.SUCCESS[500], COLORS.WARNING[500], COLORS.ERROR[500], COLORS.INFO[500], COLORS.SECONDARY[500]],
    formatter = formatNumber,
    height = DEFAULT_CHART_HEIGHT
}) => {
    const renderLabel = (entry) => {
        const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
        if (total === 0) return '';
        const percent = ((entry[dataKey] / total) * 100).toFixed(1);
        const label = entry[nameKey] || entry.name || entry.status || entry.priority || entry.gender || entry.sub_role || 'N/A';
        return `${label}: ${percent}%`;
    };

    // Transform data to include name for legend
    const transformedData = data.map(item => ({
        ...item,
        name: item[nameKey] || item.name || item.status || item.priority || item.gender || item.sub_role || item.species_name || 'N/A'
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={transformedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey={dataKey}
                    nameKey="name"
                >
                    {transformedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={formatter} contentStyle={DEFAULT_TOOLTIP_STYLE} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export const LineChartComponent = ({
    data,
    dataKey,
    xAxisKey,
    name,
    stroke = COLORS.PRIMARY[500],
    formatter = formatNumber,
    xAxisAngle = 0,
    xAxisHeight = DEFAULT_X_AXIS_HEIGHT,
    yAxisFormatter,
    height = DEFAULT_CHART_HEIGHT,
    showArea = false
}) => {
    const ChartComponent = showArea ? AreaChart : LineChart;
    const DataComponent = showArea ? Area : Line;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={data} margin={DEFAULT_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xAxisKey}
                    tick={{ fontSize: DEFAULT_TICK_FONT_SIZE }}
                    angle={xAxisAngle}
                    textAnchor={xAxisAngle !== 0 ? 'end' : 'middle'}
                    height={xAxisHeight}
                />
                <YAxis
                    tick={{ fontSize: DEFAULT_TICK_FONT_SIZE }}
                    tickFormatter={yAxisFormatter}
                />
                <Tooltip
                    formatter={formatter}
                    contentStyle={DEFAULT_TOOLTIP_STYLE}
                />
                <Legend />
                <DataComponent
                    type="monotone"
                    dataKey={dataKey}
                    stroke={stroke}
                    fill={showArea ? stroke : 'none'}
                    fillOpacity={showArea ? 0.3 : 1}
                    name={name}
                    strokeWidth={2}
                />
            </ChartComponent>
        </ResponsiveContainer>
    );
};

