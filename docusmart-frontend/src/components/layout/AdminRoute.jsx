import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const token = localStorage.getItem('docusmart_token');
  const user = JSON.parse(localStorage.getItem('docusmart_user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.roles?.some(role => role.name === 'admin');

  if (!isAdmin) {
    // If not admin, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
