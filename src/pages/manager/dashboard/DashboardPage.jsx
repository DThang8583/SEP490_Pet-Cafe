import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import AlertModal from '../../../components/modals/AlertModal';
import statisticsApi from '../../../api/statisticsApi';
import { OverviewSection, TasksSection, RevenueSection, OrdersSection, ProductsSection, ServicesSection } from './DashboardMainSections';
import { PetsSection, PetsHealthSection, PetGroupsSection, SlotsSection, FeedbacksSection, EmployeesSection, TeamsSection, EmployeesPerformanceSection, DailyTasksSection, WorkShiftsSection, CustomersSection, InventorySection } from './DashboardExtendedSections';

// API configuration mapping
const API_CONFIG = [
    { key: 'revenueData', api: statisticsApi.getRevenueStatistics, name: 'revenue' },
    { key: 'ordersData', api: statisticsApi.getOrdersStatistics, name: 'orders' },
    { key: 'productsData', api: statisticsApi.getProductsStatistics, name: 'products' },
    { key: 'servicesData', api: statisticsApi.getServicesStatistics, name: 'services' },
    { key: 'slotsData', api: statisticsApi.getSlotsStatistics, name: 'slots' },
    { key: 'feedbacksData', api: statisticsApi.getFeedbacksStatistics, name: 'feedbacks' },
    { key: 'petsData', api: statisticsApi.getPetsStatistics, name: 'pets' },
    { key: 'petsHealthData', api: statisticsApi.getPetsHealthStatistics, name: 'pets health' },
    { key: 'petGroupsData', api: statisticsApi.getPetGroupsStatistics, name: 'pet groups' },
    { key: 'employeesData', api: statisticsApi.getEmployeesStatistics, name: 'employees' },
    { key: 'teamsData', api: statisticsApi.getTeamsStatistics, name: 'teams' },
    { key: 'employeesPerformanceData', api: statisticsApi.getEmployeesPerformanceStatistics, name: 'employees performance' },
    { key: 'tasksData', api: statisticsApi.getTasksStatistics, name: 'tasks' },
    { key: 'dailyTasksData', api: statisticsApi.getDailyTasksStatistics, name: 'daily tasks' },
    { key: 'workShiftsData', api: statisticsApi.getWorkShiftsStatistics, name: 'work shifts' },
    { key: 'customersStats', api: statisticsApi.getCustomersStatistics, name: 'customers' },
    { key: 'inventoryStats', api: statisticsApi.getInventoryStatistics, name: 'inventory' },
    { key: 'overviewStats', api: statisticsApi.getDashboardOverviewStatistics, name: 'dashboard overview' }
];

const DashboardPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        revenueData: null,
        ordersData: null,
        productsData: null,
        servicesData: null,
        slotsData: null,
        feedbacksData: null,
        petsData: null,
        petsHealthData: null,
        petGroupsData: null,
        employeesData: null,
        teamsData: null,
        employeesPerformanceData: null,
        tasksData: null,
        dailyTasksData: null,
        workShiftsData: null,
        customersStats: null,
        inventoryStats: null,
        overviewStats: null
    });
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Load statistics data
    const loadStatistics = async () => {
        try {
            setIsLoading(true);

            // Load all statistics in parallel
            const responses = await Promise.allSettled(
                API_CONFIG.map(config => config.api())
            );

            // Process responses and update state
            const updatedStatistics = {};
            responses.forEach((response, index) => {
                const config = API_CONFIG[index];
                if (response.status === 'fulfilled') {
                    updatedStatistics[config.key] = response.value;
                } else {
                    console.error(`Failed to load ${config.name} statistics:`, response.reason);
                    updatedStatistics[config.key] = null;
                }
            });

            setStatistics(updatedStatistics);
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
    }, []);

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
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.PRIMARY[600] }}>
                        Tổng quan
                    </Typography>
                </Box>

                {/* Overview - Always first */}
                <OverviewSection overviewStats={statistics.overviewStats} />

                {/* Statistics sections in API order */}
                <RevenueSection revenueData={statistics.revenueData} />
                <OrdersSection ordersData={statistics.ordersData} />
                <ProductsSection productsData={statistics.productsData} />
                <ServicesSection servicesData={statistics.servicesData} />
                <SlotsSection slotsData={statistics.slotsData} />
                <FeedbacksSection feedbacksData={statistics.feedbacksData} />
                <PetsSection petsData={statistics.petsData} />
                <PetsHealthSection petsHealthData={statistics.petsHealthData} />
                <PetGroupsSection petGroupsData={statistics.petGroupsData} />
                <EmployeesSection employeesData={statistics.employeesData} />
                <TeamsSection teamsData={statistics.teamsData} />
                <EmployeesPerformanceSection employeesPerformanceData={statistics.employeesPerformanceData} />
                <TasksSection tasksData={statistics.tasksData} />
                <DailyTasksSection dailyTasksData={statistics.dailyTasksData} />
                <WorkShiftsSection workShiftsData={statistics.workShiftsData} />
                <CustomersSection customersStats={statistics.customersStats} />
                <InventorySection inventoryStats={statistics.inventoryStats} />
            </Container>

            <AlertModal
                open={alert.open}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert(prev => ({ ...prev, open: false }))}
            />
        </Box>
    );
};

export default DashboardPage;
