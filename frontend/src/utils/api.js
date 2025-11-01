import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Sending token:', token.substring(0, 20) + '...'); // Debug log
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('Network error:', error.message);
    }

    // Add error message to the error object
    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default api;
