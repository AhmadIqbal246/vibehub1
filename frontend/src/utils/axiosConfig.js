import axios from 'axios';
import Cookies from 'js-cookie';
import { fetchCSRFToken } from './csrf';

// Create axios instance with default config
const axiosInstance = axios.create({
  withCredentials: true
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get CSRF token from cookies
    const csrfToken = Cookies.get('csrftoken');
    
    // If no CSRF token and it's a mutation request (POST, PUT, DELETE)
    if (!csrfToken && ['post', 'put', 'delete'].includes(config.method)) {
      // Fetch new CSRF token
      await fetchCSRFToken();
    }
    
    // Add CSRF token to headers
    config.headers['X-CSRFToken'] = Cookies.get('csrftoken');
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance; 