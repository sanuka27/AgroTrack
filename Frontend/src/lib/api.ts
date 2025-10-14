/**
 * API Client Configuration
 * 
 * Centralized Axios instance for backend API communication
 * Includes authentication, error handling, and token refresh
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds authentication token to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
  // Try all possible token names for compatibility (include 'jwt' from some examples)
  const token = localStorage.getItem('agrotrack_token') || 
          localStorage.getItem('accessToken') || 
          localStorage.getItem('authToken') ||
          localStorage.getItem('jwt');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response interceptor - handles errors and token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          localStorage.getItem('agrotrack_refresh_token') ||
          localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          // Your backend returns: { data: { tokens: { accessToken, refreshToken } } }
          const accessToken = response?.data?.data?.tokens?.accessToken;
          const newRefreshToken = response?.data?.data?.tokens?.refreshToken;

          // Save new token(s)
          if (accessToken) {
            localStorage.setItem('agrotrack_token', accessToken);
            localStorage.setItem('accessToken', accessToken); // keep backward compatibility
          }
          if (newRefreshToken) {
            localStorage.setItem('agrotrack_refresh_token', newRefreshToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // clear and redirect
        ['agrotrack_token','accessToken','authToken','agrotrack_refresh_token','refreshToken','user']
          .forEach(k => localStorage.removeItem(k));
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.response?.data?.error;
    if (message) return message;

    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }

    return error.message || 'An unexpected error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!(localStorage.getItem('agrotrack_token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken'));
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  ['agrotrack_token','accessToken','authToken','agrotrack_refresh_token','refreshToken','user']
    .forEach(k => localStorage.removeItem(k));
};

/**
 * Analyze plant health from image and/or description
 */
export const analyzePlant = async (formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/ai/plant/analyze`, {
    method: 'POST',
    body: formData,
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'Analysis failed');
  }
  return json.data;
};

export default api;