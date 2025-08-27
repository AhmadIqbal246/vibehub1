import { createAsyncThunk } from '@reduxjs/toolkit';
import ENV from '../../config';
import { setLoading, setError, loginSuccess, signupSuccess, updateProfileSuccess, logout, initializeAuth } from './authSlice';
import axiosInstance from '../../utils/axiosConfig';

// Helper function to handle API errors
const handleApiError = (error, dispatch) => {
  const errorMessage = error?.response?.data?.detail || 'An error occurred';
  if (dispatch) {
    dispatch(setError(errorMessage));
  }
  return { success: false, error: errorMessage };
};

// Initialize auth state
export const initializeAuthState = () => async (dispatch) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('Initializing auth state:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });
    
    if (!accessToken || !refreshToken) {
      console.log('No tokens found, initializing as logged out');
      dispatch(initializeAuth());
      return;
    }

    dispatch(setLoading(true));
    
    try {
      // Try to fetch current user data to validate token
      console.log('Validating token by fetching user data...');
      const response = await axiosInstance.get(`${ENV.BASE_API_URL}/auth/api/user/`);
      console.log('Token valid, user data fetched:', response.data);
      
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('username', response.data.username);
      
      dispatch(loginSuccess(response.data));
      dispatch(setLoading(false));
    } catch (apiError) {
      console.log('Token validation failed, clearing storage:', apiError);
      // Token is invalid - clear all stored data
      localStorage.clear();
      dispatch(logout());
      dispatch(setLoading(false));
    }
  } catch (error) {
    console.error('Auth initialization error:', error);
    localStorage.clear();
    dispatch(logout());
    dispatch(setLoading(false));
  }
};

// Handle Google Login Success
export const handleGoogleLoginSuccess = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await axiosInstance.get(`${ENV.BASE_API_URL}/auth/api/user/`);
    localStorage.setItem("username", response.data.username);
    dispatch(loginSuccess(response.data));
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error, dispatch);
  }
};

// Async thunk for manual login
export const loginUser = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    
    // Login request now returns JWT tokens
    const response = await axiosInstance.post(
      `${ENV.BASE_API_URL}/auth/api/manual-login/`,
      formData,
      {
        headers: { 
          "Content-Type": "application/json"
        }
      }
    );

    const { access, refresh, user } = response.data;
    
    // Store JWT tokens and user data
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('username', user.username); // Keep for backward compatibility
    
    dispatch(loginSuccess(user));
    return { success: true, data: user };
  } catch (error) {
    return handleApiError(error, dispatch);
  }
};

// Async thunk for signup
export const signupUser = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    // Signup request now returns JWT tokens
    const response = await axiosInstance.post(
      `${ENV.BASE_API_URL}/auth/api/manual-signup/`,
      formData,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const { access, refresh, user } = response.data;
    
    // Store JWT tokens and user data
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('username', user.username); // Keep for backward compatibility
    
    dispatch(signupSuccess(user));
    return user;
  } catch (error) {
    return handleApiError(error, dispatch);
  }
};

// Async thunk for fetching current user
export const fetchCurrentUser = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    const response = await axiosInstance.get(
      `${ENV.BASE_API_URL}/auth/api/user/`
    );
    dispatch(loginSuccess(response.data));
    return response.data;
  } catch (error) {
    dispatch(logout());
    return handleApiError(error, dispatch);
  }
};

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      const response = await axiosInstance.put(
        `${ENV.BASE_API_URL}/auth/api/update-profile/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        dispatch(updateProfileSuccess(response.data));
        return response.data;
      }
      return rejectWithValue("No data received from server");
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || error.message || "Failed to update profile";
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Async thunk for logout
export const logoutUser = () => async (dispatch) => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Send POST request with refresh token to blacklist it
    if (refreshToken) {
      await axiosInstance.post(
        `${ENV.BASE_API_URL}/auth/api/logout/`,
        { refresh: refreshToken }
      );
    }
    
    // Clear all stored data
    localStorage.clear();
    dispatch(logout());
    
    // Reset notification state on logout
    const { resetNotificationState } = await import('../notifications/notificationSlice');
    dispatch(resetNotificationState());
  } catch (error) {
    console.error("Logout failed", error);
    // Still logout on frontend even if API call fails
    localStorage.clear();
    dispatch(logout());
    
    // Reset notification state on logout even if API call failed
    const { resetNotificationState } = await import('../notifications/notificationSlice');
    dispatch(resetNotificationState());
  }
};
