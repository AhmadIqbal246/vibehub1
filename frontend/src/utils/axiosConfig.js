import axios from 'axios';
import ENV from '../config';

// Create axios instance with default config
const axiosInstance = axios.create({
  withCredentials: true
});

// Request interceptor - Add JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get JWT access token from localStorage
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh automatically
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('Axios interceptor triggered:', {
      status: error.response?.status,
      url: originalRequest?.url,
      hasRetry: originalRequest?._retry
    });
    
    // If we get 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      console.log('Attempting token refresh with refresh token:', refreshToken ? 'Present' : 'Missing');
      
      if (refreshToken) {
        try {
          console.log('Calling refresh endpoint...');
          // Try to refresh the token using a new axios instance to avoid interceptor loop
          const response = await axios.post(`${ENV.BASE_API_URL}/auth/api/token/refresh/`, {
            refresh: refreshToken
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Refresh successful:', response.data);
          const { access, refresh: newRefresh } = response.data;
          
          // Store new tokens
          localStorage.setItem('access_token', access);
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh);
            console.log('New refresh token stored');
          }
          
          // Update the authorization header for the failed request
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          
          console.log('Retrying original request with new token');
          // Retry the original request with new token
          return axiosInstance(originalRequest);
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          console.log('Refresh error response:', refreshError.response?.data);
          
          // Refresh failed - clear tokens and redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.log('No refresh token found, redirecting to login');
        // No refresh token - clear tokens and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
