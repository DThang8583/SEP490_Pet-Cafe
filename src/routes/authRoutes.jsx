import React from "react";
import { Route } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

const authRoutes = (
    <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
    </Route>
);

export default authRoutes; 