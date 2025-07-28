import axios from 'axios';
import ENV from '../config';

export const fetchCSRFToken = async () => {
  try {
    await axios.get(`${ENV.BASE_API_URL}/auth/api/csrf/`, {
      withCredentials: true
    });
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
  }
}; 