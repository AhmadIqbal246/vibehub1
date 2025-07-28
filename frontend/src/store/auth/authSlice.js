import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {
    username: null,
    email: null,
    first_name: null,
    last_name: null,
    phone_number: null,
    profile_picture_url: null,
    bio: null,
    date_of_birth: null,
    gender: null,
    gender_display: null
  },
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false // Add this to track if auth has been initialized
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
      if (action.payload === true) {
        state.error = null;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.isInitialized = true;
    },
    signupSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.isInitialized = true;
    },
    updateProfileSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = initialState.user;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.isInitialized = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      state.isInitialized = true;
    }
  }
});

export const {
  setLoading,
  setError,
  loginSuccess,
  signupSuccess,
  updateProfileSuccess,
  logout,
  clearError,
  initializeAuth
} = authSlice.actions;

export default authSlice.reducer; 