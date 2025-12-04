import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import HomePage from "./components/home/HomePage";
import RoleBasedRedirect from "./components/auth/RoleBasedRedirect";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import MenuPage from "./pages/menu/MenuPage";
import AreasPage from "./pages/areas/AreasPage";
import ProfilePage from "./pages/profile/ProfilePage";
import BookingPage from "./pages/booking/BookingPage";
import BookingFormPage from "./pages/booking/BookingFormPage";
import BookingCartPage from "./pages/booking/BookingCartPage";
import BookingPaymentSuccessPage from "./pages/booking/BookingPaymentSuccessPage";
import BookingPaymentFailedPage from "./pages/booking/BookingPaymentFailedPage";
import managerRoutes from "./routes/managerRoutes";
import salesRoutes from "./routes/salesRoutes";
import workingRoutes from "./routes/workingRoutes";

function App() {
  return (
    <div>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Main Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/form" element={<BookingFormPage />} />
          <Route path="/booking/cart" element={<BookingCartPage />} />
          <Route path="/booking/payment-success" element={<BookingPaymentSuccessPage />} />
          <Route path="/booking/payment-failed" element={<BookingPaymentFailedPage />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {managerRoutes}
          {salesRoutes}
          {workingRoutes}
        </Route>
      </Routes>
    </div>
  );
}

export default App;