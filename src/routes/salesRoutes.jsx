import React from "react";
import { Route } from "react-router-dom";
import SalesDashboardPage from "../pages/sales/DashboardPage";
import SalesPage from "../pages/sales/SalesPage";
import SalesCheckoutPage from "../pages/sales/CheckoutPage";
import ServiceSalesPage from "../pages/sales/ServiceSalesPage";
import CartPage from "../pages/sales/CartPage";
import SuccessPage from "../pages/sales/SuccessPage";
import ProductConfirmPage from "../pages/sales/ProductConfirmPage";
import PetGroupsPage from "../pages/sales/PetGroupsPage";
import PetStatusPage from "../pages/sales/PetStatusPage";
import AttendancePage from "../pages/sales/AttendancePage";
import JoinedGroupsPage from "../pages/sales/JoinedGroupsPage";
import ServiceBookingConfirmPage from "../pages/sales/ServiceBookingConfirmPage";
import ProductSalesConfirmPage from "../pages/sales/ProductSalesConfirmPage";
import SalesNotificationsPage from "../pages/sales/NotificationsPage";
import SalesInvoicePage from "../pages/sales/InvoicePage";
import ServiceBookingDetailPage from "../pages/sales/ServiceBookingDetailPage";
import ProductOrderDetailPage from "../pages/sales/ProductOrderDetailPage";
import SalesTeamsPage from "../pages/sales/SalesTeamsPage";
import StaffLeaveNotificationsPage from "../pages/sales/StaffLeaveNotificationsPage";
import TeamLeaveRequestsPage from "../pages/sales/TeamLeaveRequestsPage";
import LeaveRequestPage from "../pages/sales/LeaveRequestPage";
import SalesLeaveRequestPage from "../pages/sales/SalesLeaveRequestPage";

const salesRoutes = (
    <>
        <Route path="/sales/dashboard" element={<SalesDashboardPage />} />
        <Route path="/sales/sales" element={<SalesPage />} />
        <Route path="/sales/checkout" element={<SalesCheckoutPage />} />
        <Route path="/sales/services" element={<ServiceSalesPage />} />
        <Route path="/sales/cart" element={<CartPage />} />
        <Route path="/sales/paid-success" element={<SuccessPage />} />
        <Route path="/sales/confirm" element={<ProductConfirmPage />} />
        <Route path="/sales/pet-groups" element={<PetGroupsPage />} />
        <Route path="/sales/pet-status" element={<PetStatusPage />} />
        <Route path="/sales/attendance" element={<AttendancePage />} />
        <Route path="/sales/teams" element={<SalesTeamsPage />} />
        <Route path="/sales/joined-groups" element={<JoinedGroupsPage />} />
        <Route path="/sales/service-booking-confirm" element={<ServiceBookingConfirmPage />} />
        <Route path="/sales/product-sales-confirm" element={<ProductSalesConfirmPage />} />
        <Route path="/sales/notifications" element={<SalesNotificationsPage />} />
        <Route path="/sales/notifications/leave" element={<StaffLeaveNotificationsPage />} />
        <Route path="/sales/invoice" element={<SalesInvoicePage />} />
        <Route path="/sales/service-booking/:orderId" element={<ServiceBookingDetailPage />} />
        <Route path="/sales/product-order/:orderId" element={<ProductOrderDetailPage />} />
        <Route path="/sales/leave-requests" element={<LeaveRequestPage />} />
        <Route path="/sales/leave-requests/new" element={<SalesLeaveRequestPage />} />
        <Route path="/sales/leader/leave-requests" element={<TeamLeaveRequestsPage />} />
    </>
);

export default salesRoutes;


