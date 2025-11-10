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
  // Step 1: upload to disease-detection (stores in Firebase, returns public URL + storage path)
  const uploadResp = await fetch(`${API_BASE_URL}/disease-detection/upload`, {
    method: 'POST',
    body: (() => {
      const fd = new FormData();
      // Map incoming keys: expects 'photo' from UI; backend expects 'image'
      const photo = formData.get('photo');
      if (photo) fd.append('image', photo as Blob);
      return fd;
    })(),
    credentials: 'include',
  });
  const uploadJson = await uploadResp.json();
  if (!uploadJson.success) {
    throw new Error(uploadJson.message || 'Image upload failed');
  }
  const { imageUrl, filename } = uploadJson.data || {};
  if (!imageUrl) throw new Error('Upload did not return imageUrl');

  // Step 2: detect disease with selected plant context
  const detectBody: any = {
    imageUrl,
    originalFileName: formData.get('description') ? 'uploaded_image.jpg' : (formData.get('photo') as any)?.name || 'uploaded_image.jpg',
  };
  const pid = formData.get('plantId');
  const pname = formData.get('plantName');
  if (pid) detectBody.plantId = pid;
  if (pname) detectBody.plantName = pname;
  if (formData.get('description')) detectBody.description = formData.get('description');
  
  // Add selected symptoms if present
  const symptoms = formData.getAll('selectedSymptoms');
  if (symptoms && symptoms.length > 0) {
    detectBody.selectedSymptoms = symptoms;
  }

  const detectResp = await fetch(`${API_BASE_URL}/disease-detection/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(detectBody),
    credentials: 'include',
  });
  const detectJson = await detectResp.json();
  console.log('[AI Debug] Full backend response:', detectJson);
  
  if (!detectJson.success) {
    throw new Error(detectJson.message || 'Detection failed');
  }
  // Map disease-detection controller output to expected PlantAnalysis
  const det = detectJson.data?.detection;
  console.log('[AI Debug] Detection object:', det);
  console.log('[AI Debug] Detection results:', det?.detectionResults);
  
  if (det?.detectionResults) {
    const r = det.detectionResults;
    const result: any = {
      likelyDiseases: [] as { name: string; confidence: 'low'|'medium'|'high'; why: string }[],
      urgency: 'low' as 'low'|'medium'|'high',
      careSteps: [] as string[],
      prevention: [] as string[],
      imageUrl: det.imageUrl || '', // Include the Firebase Storage URL
      detectionResults: r, // Include full detection results for reference
    };
    if (r.diseaseDetected && r.primaryDisease) {
      result.likelyDiseases = [
        { name: r.primaryDisease.name, confidence: (r.confidence>0.66?'high':r.confidence>0.33?'medium':'low'), why: r.primaryDisease.category || 'Detected by AI' }
      ];
      result.urgency = (det.treatmentRecommendations?.followUpRequired ? (r.primaryDisease.severity==='severe'||r.primaryDisease.severity==='critical'?'high':'medium') : 'low');
    }
    if (det.treatmentRecommendations) {
      result.careSteps = [
        ...det.treatmentRecommendations.immediateActions || [],
        ...((det.treatmentRecommendations.treatments||[]).map((t:any)=>`${t.type}: ${t.name}${t.applicationMethod?` (${t.applicationMethod})`:''}`))
      ];
      result.prevention = det.treatmentRecommendations.preventionMeasures || [];
    }
    console.log('[AI Debug] Returning result with imageUrl:', result.imageUrl);
    return result;
  }
  // Fallback to AI chat format if not present
  return detectJson.data;
};

export default api;