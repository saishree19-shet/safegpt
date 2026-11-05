/**
 * PublicOnlyRoute — wraps login/signup pages.
 * Authenticated users are redirected away from these pages to their
 * role-appropriate dashboard instead of seeing the form again.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFDFB]">
        <div className="w-6 h-6 border-2 border-darkGreen/30 border-t-darkGreen rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    const destination = user.role === 'admin' ? '/admin' : '/app';
    return <Navigate to={destination} replace />;
  }

  return children;
}

