import React from "react";
import { Route } from "react-router-dom";
import WorkingDashboardPage from "../pages/working/WorkingDashboardPage";
import WorkingTeamsPage from "../pages/working/WorkingTeamsPage";
import WorkingTasksPage from "../pages/working/WorkingTasksPage";
import WorkingAttendancePage from "../pages/working/WorkingAttendancePage";
import WorkingBookingsPage from "../pages/working/WorkingBookingsPage";
import WorkingLeaveRequestPage from "../pages/working/WorkingLeaveRequestPage";
import LeaderTaskCenterPage from "../pages/working/LeaderTaskCenterPage";
import LeaderTaskDetailPage from "../pages/working/LeaderTaskDetailPage";
import LeaderBookingsPage from "../pages/working/LeaderBookingsPage";
import WorkingNotificationsPage from "../pages/working/NotificationsPage";

const workingRoutes = (
    <>
        <Route path="/staff/dashboard" element={<WorkingDashboardPage />} />
        <Route path="/staff/teams" element={<WorkingTeamsPage />} />
        <Route path="/staff/daily-tasks" element={<WorkingTasksPage />} />
        <Route path="/staff/attendance" element={<WorkingAttendancePage />} />
        <Route path="/staff/bookings" element={<WorkingBookingsPage />} />
        <Route path="/staff/leave-request" element={<WorkingLeaveRequestPage />} />
        <Route path="/staff/notifications" element={<WorkingNotificationsPage />} />

        {/* Leader only */}
        <Route path="/staff/leader/task-center" element={<LeaderTaskCenterPage />} />
        <Route path="/staff/leader/daily-tasks/:taskId" element={<LeaderTaskDetailPage />} />
        <Route path="/staff/leader/bookings" element={<LeaderBookingsPage />} />
    </>
);

export default workingRoutes;

