// AI Smart Suggestions API Client
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Some parts of the app store token under 'agrotrack_token'
  const token = localStorage.getItem('agrotrack_token') || localStorage.getItem('token');
  if (token) {
    // cast to any to avoid Axios header typing differences
    (config.headers as any) = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AISmartSuggestion {
  _id: string;
  type: 'pro_tip' | 'growth_insight' | 'alert' | 'care_reminder' | 'health_warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  plantId?: {
    _id: string;
    name: string;
    imageUrl?: string;
    category?: string;
  };
  isRead: boolean;
  isDismissed: boolean;
  isActioned: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface GroupedSuggestions {
  pro_tips: AISmartSuggestion[];
  growth_insights: AISmartSuggestion[];
  alerts: AISmartSuggestion[];
  care_reminders: AISmartSuggestion[];
  health_warnings: AISmartSuggestion[];
}

/**
 * Generate AI suggestions for user's plants
 */
export const generateAISuggestions = async (plantId?: string) => {
  const response = await api.post('/ai/suggestions/generate', { plantId });
  // backend returns { success: true, data: { suggestions, count }, ... }
  return response.data?.data || { suggestions: [], count: 0 };
};

/**
 * Get user's AI suggestions
 */
export const getAISuggestions = async (options?: {
  includeRead?: boolean;
  includeDismissed?: boolean;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (options?.includeRead) params.append('includeRead', 'true');
  if (options?.includeDismissed) params.append('includeDismissed', 'true');
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await api.get(`/ai/suggestions?${params.toString()}`);
  // backend returns { success: true, data: { suggestions, grouped, total } }
  return response.data?.data || { suggestions: [], grouped: {}, total: 0 };
};

/**
 * Mark suggestion as read
 */
export const markSuggestionAsRead = async (suggestionId: string) => {
  const response = await api.put(`/ai/suggestions/${suggestionId}/read`);
  return response.data;
};

/**
 * Dismiss a suggestion
 */
export const dismissSuggestion = async (suggestionId: string) => {
  const response = await api.put(`/ai/suggestions/${suggestionId}/dismiss`);
  return response.data;
};

/**
 * Mark suggestion as actioned
 */
export const actionSuggestion = async (suggestionId: string) => {
  const response = await api.put(`/ai/suggestions/${suggestionId}/action`);
  return response.data;
};
