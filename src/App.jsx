import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import { authRoutes } from "./routes";

function App() {
  return (
    <div>
      <Routes>
        {authRoutes}

        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;