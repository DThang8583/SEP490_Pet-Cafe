import React from "react";
import { Route } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";
import LoginPage from "../pages/auth/LoginPage";

const authRoutes = (
    <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
    </Route>
);

export default authRoutes; 