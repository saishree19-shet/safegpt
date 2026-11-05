import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Employee Dashboard
import EmployeeLayout from './pages/employee/EmployeeLayout';
import OverviewTab from './pages/employee/OverviewTab';
import DocumentsTab from './pages/employee/DocumentsTab';
import AskTab from './pages/employee/AskTab';
import SecurityTab from './pages/employee/SecurityTab';
import SettingsTab from './pages/employee/SettingsTab';

// Admin Dashboard placeholder (Step 7.4)
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

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
          <Route index element={<OverviewTab />} />
          <Route path="documents" element={<DocumentsTab />} />
          <Route path="ask" element={<AskTab />} />
          <Route path="security" element={<SecurityTab />} />
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
