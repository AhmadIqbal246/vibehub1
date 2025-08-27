import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import notificationReducer from './notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
  },
});

export default store; 