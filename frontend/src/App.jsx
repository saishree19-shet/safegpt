import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

import LandingPage from './pages/LandingPage';
import GetStartedPage from './pages/GetStartedPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Employee Dashboard & Workspace Modules
import EmployeeLayout from './pages/employee/EmployeeLayout';
import SearchTab from './pages/employee/SearchTab';
import DocumentsTab from './pages/employee/DocumentsTab';
import AskTab from './pages/employee/AskTab';
import ScheduleTab from './pages/employee/ScheduleTab';
import PrivacyReviewTab from './pages/admin/PrivacyReviewTab';
import AccessControlTab from './pages/admin/AccessControlTab';
import AuditLogsTab from './pages/admin/AuditLogsTab';
import SettingsTab from './pages/employee/SettingsTab';

// Admin Dashboard
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing & Documentation */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<GetStartedPage />} />

        {/* Public-only Auth Pages */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Employee Workspace */}
        <Route
          path="/app"
          element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SearchTab />} />
          <Route path="search" element={<SearchTab />} />
          <Route path="ask" element={<AskTab />} />
          <Route path="chat" element={<AskTab />} />
          <Route path="documents" element={<DocumentsTab />} />
          <Route path="schedule" element={<ScheduleTab />} />
          <Route path="privacy" element={<PrivacyReviewTab />} />
          <Route path="settings" element={<SettingsTab />} />
        </Route>

        {/* Backward-compatibility: redirect /employee to /app */}
        <Route path="/employee" element={<Navigate to="/app" replace />} />
        <Route path="/employee/*" element={<Navigate to="/app" replace />} />

        {/* Protected: admin role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
