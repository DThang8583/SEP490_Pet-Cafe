import React from "react";
import { Route } from "react-router-dom";
import SalesDashboardPage from "../pages/sales/DashboardPage";
import SalesPage from "../pages/sales/SalesPage";
import InvoicesPage from "../pages/sales/InvoicesPage";
import SalesCheckoutPage from "../pages/sales/CheckoutPage";
import ServiceSalesPage from "../pages/sales/ServiceSalesPage";
import CartPage from "../pages/sales/CartPage";
import SuccessPage from "../pages/sales/SuccessPage";
import ProductConfirmPage from "../pages/sales/ProductConfirmPage";
import PetGroupsPage from "../pages/sales/PetGroupsPage";
import PetStatusPage from "../pages/sales/PetStatusPage";

const salesRoutes = (
    <>
        <Route path="/sales/dashboard" element={<SalesDashboardPage />} />
        <Route path="/sales/sales" element={<SalesPage />} />
        <Route path="/sales/invoices" element={<InvoicesPage />} />
        <Route path="/sales/checkout" element={<SalesCheckoutPage />} />
        <Route path="/sales/services" element={<ServiceSalesPage />} />
        <Route path="/sales/cart" element={<CartPage />} />
        <Route path="/sales/paid-success" element={<SuccessPage />} />
        <Route path="/sales/confirm" element={<ProductConfirmPage />} />
        <Route path="/sales/pet-groups" element={<PetGroupsPage />} />
        <Route path="/sales/pet-status" element={<PetStatusPage />} />
    </>
);

export default salesRoutes;


