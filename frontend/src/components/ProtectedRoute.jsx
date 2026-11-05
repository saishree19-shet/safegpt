/**
 * ProtectedRoute — renders children only when the user is authenticated.
 * Unauthenticated users are redirected to /login with the original path
 * preserved in location state so they can be sent back after login.
 *
 * Shows nothing (null) while the initial session check is in progress
 * to avoid a flash of the login page on page refresh.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Session restoration in progress — render nothing yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFDFB]">
        <div className="flex flex-col items-center gap-3 text-charcoal/50">
          <div className="w-6 h-6 border-2 border-darkGreen/30 border-t-darkGreen rounded-full animate-spin" />
          <span className="text-xs font-mono">Verifying session…</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role (e.g. employee trying to access /admin)
  if (requiredRole && user.role !== requiredRole) {
    const fallback = user.role === 'admin' ? '/admin' : '/app';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

