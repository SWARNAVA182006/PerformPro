import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { isAuthenticated, hasRole } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />; // Render child routes
};

export default ProtectedRoute;
