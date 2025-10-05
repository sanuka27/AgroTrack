import mockApi from './mockApi';
import api from './api';

// Use mock API in development, real API in production
const isDevelopment = import.meta.env.DEV;
const isMockMode = import.meta.env.VITE_USE_MOCK_API === 'true' || isDevelopment;

export const apiService = isMockMode ? mockApi : api;

export default apiService;