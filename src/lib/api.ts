import axios from 'axios';
import { getToken, clearToken } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // This sends cookies automatically
  timeout: 10000, // 10 second timeout
});

// Request interceptor - ONLY set Authorization header if using token-based auth
api.interceptors.request.use(
  (config) => {
    // For routes that use token-based auth (like your payment requests)
    const token = getToken();
    if (token && config.url?.includes('/payment-Request')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For asset and trip requests, rely on cookies (withCredentials: true)
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      clearToken();
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Return the error message from server or default message
    const errorMessage = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;