import mockApi from './mockApi';
import api from './api';

// Use mock API only when explicitly enabled via VITE_USE_MOCK_API.
// Previously the app used the mock API by default in development which
// prevented the frontend from calling the real backend during local runs.
// Change: only enable mock when VITE_USE_MOCK_API is set to 'true'.
const isMockMode = import.meta.env.VITE_USE_MOCK_API === 'true';

export const apiService = isMockMode ? mockApi : api;

export default apiService;