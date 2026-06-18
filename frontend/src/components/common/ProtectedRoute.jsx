import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects a route by:
 * 1. Showing a loading spinner while auth state is being resolved
 * 2. Redirecting unauthenticated users to /login (preserving the destination)
 * 3. Redirecting users with wrong role to their appropriate dashboard
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-2 border-t-transparent border-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Not logged in → send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin')    return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'hr')       return <Navigate to="/hr/dashboard" replace />;
    if (user.role === 'student')  return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
