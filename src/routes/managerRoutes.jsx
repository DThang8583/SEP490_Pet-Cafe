import React from "react";
import { Route } from "react-router-dom";
import DashboardPage from "../pages/manager/DashboardPage";
import PetsPage from "../pages/manager/pets/PetsPage";
import VaccinationsPage from "../pages/manager/VaccinationsPage";
import StaffPage from "../pages/manager/StaffPage";
import TasksPage from "../pages/manager/tasks/TasksPage";
import ServicesPage from "../pages/manager/ServicesPage";
import InventoryPage from "../pages/manager/InventoryPage";
import AreasPage from "../pages/manager/AreasPage";

const managerRoutes = (
    <>
        <Route path="/manager/dashboard" element={<DashboardPage />} />
        <Route path="/manager/pets" element={<PetsPage />} />
        <Route path="/manager/vaccinations" element={<VaccinationsPage />} />
        <Route path="/manager/areas" element={<AreasPage />} />
        <Route path="/manager/staff" element={<StaffPage />} />
        <Route path="/manager/tasks" element={<TasksPage />} />
        <Route path="/manager/services" element={<ServicesPage />} />
        <Route path="/manager/inventory" element={<InventoryPage />} />
    </>
);

export default managerRoutes;


