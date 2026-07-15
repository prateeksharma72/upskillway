// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        
        // Add user role to headers if available
        const userRole = localStorage.getItem('userRole');
        if (userRole) {
          config.headers['X-User-Role'] = userRole;
        }
        
        console.log('API Request with JWT token');
      } else {
        console.log('API Request without auth token');
      }
    } catch (error) {
      console.error('Error getting JWT token:', error);
      // Continue with request even if token fails
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          if (response.data.token) {
            const newToken = response.data.token;
            localStorage.setItem('authToken', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            console.log('JWT Token refreshed, retrying request');
            return api(originalRequest);
          }
        }
        
        // If refresh fails, clear storage and redirect to login
        console.log('Token refresh failed, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear local storage and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    }
    
    // Handle other common errors
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Could redirect to unauthorized page
      // window.location.href = '/unauthorized';
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
      // Could show a global error message
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      // Could show timeout message
    }
    
    if (!error.response) {
      console.error('Network error:', error.message);
      // Could show network error message
    }
    
    return Promise.reject(error);
  }
);

// Helper function to make authenticated requests with better error handling
export const makeAuthenticatedRequest = async (requestConfig) => {
  try {
    const response = await api(requestConfig);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('API Request failed:', error);
    return { 
      data: null, 
      error: {
        message: error.response?.data?.message || error.message || 'Request failed',
        status: error.response?.status,
        code: error.code
      }
    };
  }
};

// Helper functions for common request types
export const apiGet = (url, config = {}) => makeAuthenticatedRequest({ method: 'GET', url, ...config });
export const apiPost = (url, data, config = {}) => makeAuthenticatedRequest({ method: 'POST', url, data, ...config });
export const apiPut = (url, data, config = {}) => makeAuthenticatedRequest({ method: 'PUT', url, data, ...config });
export const apiDelete = (url, config = {}) => makeAuthenticatedRequest({ method: 'DELETE', url, ...config });

export default api;