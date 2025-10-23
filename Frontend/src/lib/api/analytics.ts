/**
 * Analytics API Module
 * 
 * Handles all analytics-related API operations:
 * - Dashboard analytics
 * - Plant health analytics
 * - Care history analytics
 * - Community engagement analytics
 * 
 * Backend Endpoints: /api/analytics
 * MongoDB Collections: dashboardanalytics, planthealthanalytics, carehistoryanalytics, communityengagementanalytics
 */

import api, { getErrorMessage } from '../api';

/**
 * Dashboard analytics type
 */
export interface DashboardAnalytics {
  userId: string;
  totalPlants: number;
  healthyPlants: number;
  needsAttention: number;
  criticalPlants: number;
  totalCareLogs: number;
  careThisWeek: number;
  careThisMonth: number;
  upcomingReminders: number;
  overdueReminders: number;
  communityPosts: number;
  postsThisMonth: number;
  lastUpdated: string;
}

/**
 * Plant health analytics type
 */
export interface PlantHealthAnalytics {
  plantId: string;
  plantName: string;
  species: string;
  overallHealth: number; // 0-100
  wateringScore: number; // 0-100
  fertilizingScore: number; // 0-100
  sunlightScore: number; // 0-100
  careFrequency: {
    watering: number;
    fertilizing: number;
    pruning: number;
  };
  lastCareDate?: string;
  nextRecommendedCare?: string;
  healthTrend: 'improving' | 'stable' | 'declining';
  suggestions: string[];
  lastUpdated: string;
}

/**
 * Care history analytics type
 */
export interface CareHistoryAnalytics {
  plantId: string;
  period: 'week' | 'month' | 'year';
  careTypes: {
    watering: number;
    fertilizing: number;
    pruning: number;
    repotting: number;
    pestControl: number;
    other: number;
  };
  totalCareLogs: number;
  averageHealthScore: number;
  mostFrequentCareType: string;
  careConsistency: number; // 0-100
  insights: string[];
  lastUpdated: string;
}

/**
 * Community engagement analytics type
 */
export interface CommunityEngagementAnalytics {
  userId: string;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  likesReceived: number;
  commentsReceived: number;
  mostPopularPost?: {
    postId: string;
    title: string;
    likes: number;
    comments: number;
  };
  engagementRate: number; // 0-100
  activeCategories: string[];
  lastUpdated: string;
}

interface DashboardAnalyticsResponse {
  success: boolean;
  data: {
    analytics: DashboardAnalytics;
  };
}

interface PlantHealthAnalyticsResponse {
  success: boolean;
  data: {
    analytics: PlantHealthAnalytics;
  };
}

interface CareHistoryAnalyticsResponse {
  success: boolean;
  data: {
    analytics: CareHistoryAnalytics;
  };
}

interface CommunityEngagementAnalyticsResponse {
  success: boolean;
  data: {
    analytics: CommunityEngagementAnalytics;
  };
}

/**
 * Analytics API Service
 */
export const analyticsApi = {
  /**
   * Get dashboard analytics for current user
   * 
   * GET /api/analytics/dashboard/simple
   * 
   * @returns Promise with dashboard analytics
   */
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    try {
      const response = await api.get<DashboardAnalyticsResponse>('/analytics/dashboard/simple');
      return response.data.data.analytics;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get plant health analytics
   * 
   * GET /api/analytics/plants/:plantId/health
   * 
   * @param plantId - Plant ID
   * @returns Promise with plant health analytics
   */
  async getPlantHealthAnalytics(plantId: string): Promise<PlantHealthAnalytics> {
    try {
      const response = await api.get<PlantHealthAnalyticsResponse>(`/analytics/plants/${plantId}/health`);
      return response.data.data.analytics;
    } catch (error) {
      console.error('Error fetching plant health analytics:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get care history analytics
   * 
   * GET /api/analytics/plants/:plantId/care-history
   * 
   * @param plantId - Plant ID
   * @param period - Time period (week, month, year)
   * @returns Promise with care history analytics
   */
  async getCareHistoryAnalytics(
    plantId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<CareHistoryAnalytics> {
    try {
      const response = await api.get<CareHistoryAnalyticsResponse>(
        `/analytics/plants/${plantId}/care-history?period=${period}`
      );
      return response.data.data.analytics;
    } catch (error) {
      console.error('Error fetching care history analytics:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get community engagement analytics for current user
   * 
   * GET /api/analytics/community/engagement
   * 
   * @returns Promise with community engagement analytics
   */
  async getCommunityEngagementAnalytics(): Promise<CommunityEngagementAnalytics> {
    try {
      const response = await api.get<CommunityEngagementAnalyticsResponse>('/analytics/community/engagement');
      return response.data.data.analytics;
    } catch (error) {
      console.error('Error fetching community engagement analytics:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Refresh analytics data
   * 
   * POST /api/analytics/refresh
   * 
   * @returns Promise that resolves when analytics are refreshed
   */
  async refreshAnalytics(): Promise<void> {
    try {
      await api.post('/analytics/refresh');
    } catch (error) {
      console.error('Error refreshing analytics:', getErrorMessage(error));
      throw error;
    }
  },
  /**
   * Get the full dashboard (widgets + analytics)
   * GET /api/analytics/dashboard
   */
  async getFullDashboard(): Promise<any> {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data.data; // { widgets, analytics, period, lastUpdated }
    } catch (error) {
      console.error('Error fetching full dashboard analytics:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get plant health analytics (summary)
   * GET /api/analytics/plant-health
   */
  async getPlantHealthSummary(params?: Record<string, any>): Promise<any> {
    try {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get(`/analytics/plant-health${query}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching plant health summary:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get growth analytics
   * GET /api/analytics/growth
   */
  async getGrowthAnalytics(params?: Record<string, any>): Promise<any> {
    try {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get(`/analytics/growth${query}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching growth analytics:', getErrorMessage(error));
      throw error;
    }
  }
};
