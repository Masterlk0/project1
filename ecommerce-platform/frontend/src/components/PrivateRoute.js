import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them along after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the user has one of the required roles
  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    // User is authenticated but does not have the required role
    // Redirect to a 'not authorized' page or home page
    // For simplicity, redirecting to home. A dedicated "Unauthorized" page would be better.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children; // User is authenticated and has the required role (if specified)
};

export default PrivateRoute;
