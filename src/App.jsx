import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import HomePage from "./components/home/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import MenuPage from "./pages/menu/MenuPage";
import AreasPage from "./pages/areas/AreasPage";
import ProfilePage from "./pages/profile/ProfilePage";

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
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/tickets" element={<div style={{ padding: '2rem', textAlign: 'center' }}><h1>Vé</h1><p>Trang vé sẽ được phát triển sau</p></div>} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;