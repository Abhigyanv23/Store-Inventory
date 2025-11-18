import axios from 'axios';

// The base URL for your backend
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// --- Interceptor ---
// This code runs BEFORE any API request is sent
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// This interceptor checks for 401/403 errors (bad token)
// and will trigger a logout if one is found.
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if the error is a 401 or 403
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // This will dispatch a custom event that App.js can listen for
      // to force a logout.
      window.dispatchEvent(new Event('forceLogout'));
    }
    return Promise.reject(error);
  }
);

export default api;
