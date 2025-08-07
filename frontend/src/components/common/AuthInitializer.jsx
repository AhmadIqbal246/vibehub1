import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeAuthState } from '../../store/auth/authActions';
import LoadingSpinner from './LoadingSpinner';

/**
 * AuthInitializer Component
 * 
 * This component handles the initialization of authentication state.
 * It wraps the entire app and ensures that the auth state is properly
 * initialized before rendering the main application.
 * 
 * Responsibilities:
 * - Initialize auth state on app startup
 * - Show loading screen while auth is being initialized
 * - Pass through to children once auth is initialized
 */
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((state) => state.auth);

  // Initialize auth state on component mount
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuthState());
    }
  }, [dispatch, isInitialized]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return <LoadingSpinner fullScreen={true} message="Initializing application..." />;
  }

  // Render children once auth is initialized
  return children;
};

export default AuthInitializer;
