import React from "react";
import { Route } from "react-router-dom";
import DashboardPage from "../pages/manager/dashboard/DashboardPage";
import PetsPage from "../pages/manager/pets/PetsPage";
import VaccinationsPage from "../pages/manager/VaccinationsPage";
import StaffPage from "../pages/manager/StaffPage";
import WorkShiftPage from "../pages/manager/WorkShiftPage";
import TasksPage from "../pages/manager/tasks/TasksPage";
import ServicesPage from "../pages/manager/ServicesPage";
import AreasPage from "../pages/manager/AreasPage";
import ProductPage from "../pages/manager/products/ProductPage";
import ManagerAttendancePage from "../pages/manager/ManagerAttendancePage";
import NotificationsPage from "../pages/manager/NotificationsPage";

const managerRoutes = (
    <>
        <Route path="/manager/dashboard" element={<DashboardPage />} />
        <Route path="/manager/pets" element={<PetsPage />} />
        <Route path="/manager/vaccinations" element={<VaccinationsPage />} />
        <Route path="/manager/areas" element={<AreasPage />} />
        <Route path="/manager/staff" element={<StaffPage />} />
        <Route path="/manager/attendance" element={<ManagerAttendancePage />} />
        <Route path="/manager/work-shifts" element={<WorkShiftPage />} />
        <Route path="/manager/tasks" element={<TasksPage />} />
        <Route path="/manager/services" element={<ServicesPage />} />
        <Route path="/manager/products" element={<ProductPage />} />
        <Route path="/manager/notifications" element={<NotificationsPage />} />
    </>
);

export default managerRoutes;


