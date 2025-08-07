import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isInitialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isInitialized || loading) {
    return <LoadingSpinner fullScreen={true} message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
