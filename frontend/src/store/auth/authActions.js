import { createAsyncThunk } from '@reduxjs/toolkit';
import ENV from '../../config';
import { setLoading, setError, loginSuccess, signupSuccess, updateProfileSuccess, logout, initializeAuth } from './authSlice';
import axiosInstance from '../../utils/axiosConfig';

// Helper function to handle API errors
const handleApiError = (error, thunkAPI) => {
  const errorMessage = error?.response?.data?.detail || 'An error occurred';
  thunkAPI.dispatch(setError(errorMessage));
  return thunkAPI.rejectWithValue(errorMessage);
};

// Initialize auth state
export const initializeAuthState = () => async (dispatch) => {
  try {
    const username = localStorage.getItem("username");
    if (!username) {
      dispatch(initializeAuth());
      return;
    }

    dispatch(setLoading(true));
    const response = await axiosInstance.get(`${ENV.BASE_API_URL}/auth/api/user/`);
    dispatch(loginSuccess(response.data));
  } catch (error) {
    localStorage.removeItem("username");
    dispatch(logout());
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
    return handleApiError(error, { dispatch });
  }
};

// Async thunk for manual login
export const loginUser = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    
    await axiosInstance.post(
      `${ENV.BASE_API_URL}/auth/api/manual-login/`,
      formData,
      {
        headers: { 
          "Content-Type": "application/json"
        }
      }
    );

    // Fetch user data after successful login
    const userResponse = await axiosInstance.get(
      `${ENV.BASE_API_URL}/auth/api/user/`
    );

    localStorage.setItem("username", userResponse.data.username);
    dispatch(loginSuccess(userResponse.data));
    return { success: true, data: userResponse.data };
  } catch (error) {
    return handleApiError(error, { dispatch });
  }
};

// Async thunk for signup
export const signupUser = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    const response = await axiosInstance.post(
      `${ENV.BASE_API_URL}/auth/api/manual-signup/`,
      formData,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Fetch user data after successful signup
    const userResponse = await axiosInstance.get(
      `${ENV.BASE_API_URL}/auth/api/user/`
    );

    localStorage.setItem("username", userResponse.data.username);
    dispatch(signupSuccess(userResponse.data));
    return userResponse.data;
  } catch (error) {
    return handleApiError(error, { dispatch });
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
    return handleApiError(error, { dispatch });
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
    await axiosInstance.get(
      `${ENV.BASE_API_URL}/auth/api/logout/`
    );
    localStorage.removeItem("username");
    dispatch(logout());
  } catch (error) {
    console.error("Logout failed", error);
    dispatch(logout()); // Still logout on frontend even if API call fails
  }
}; 