import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrotrack_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('⚠️ No auth token found in localStorage');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized: Admin access denied. Please ensure you are logged in as an admin.');
    }
    return Promise.reject(error);
  }
);

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    byRole: { [key: string]: number };
  };
  content: {
    plants: number;
    posts: number;
    careLogs: number;
    reminders: number;
  };
  activity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface User {
  _id: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface Report {
  _id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'user';
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Content {
  _id: string;
  type: 'post' | 'comment';
  title?: string;
  content: string;
  author: string;
  authorId: string;
  status: 'visible' | 'flagged' | 'removed';
  createdAt: string;
  updatedAt: string;
  reports?: number;
}

export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  // Users
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data.data.user;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}`, updates);
    return response.data.data.user;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  bulkUpdateUsers: async (action: string, userIds: string[]): Promise<void> => {
    await api.post('/admin/users/bulk', { action, userIds });
  },

  // Reports (using community forum reports)
  getReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    reports: Report[];
    total: number;
    page: number;
    limit: number;
  }> => {
    // Use admin reports endpoint (server-side implementation returns paginated reports)
    const response = await api.get('/admin/reports/content', { params });
    const data = response.data?.data || {};
    return {
      reports: data.reports || [],
      total: data.total || 0,
      page: data.page || params?.page || 1,
      limit: data.limit || params?.limit || 10,
    };
  },

  resolveReport: async (
    reportId: string,
    action: 'resolve' | 'dismiss',
    adminNote?: string
  ): Promise<void> => {
    await api.patch(`/admin/reports/${reportId}`, {
      status: action === 'resolve' ? 'resolved' : 'dismissed',
      adminNote,
    });
  },

  // Content (using community forum posts and comments)
  getContent: async (params?: {
    page?: number;
    limit?: number;
    type?: 'post' | 'comment';
    status?: string;
  }): Promise<{
    content: Content[];
    total: number;
    page: number;
    limit: number;
  }> => {
    try {
      // Call admin flagged content endpoint which returns standardized data
      const response = await api.get('/admin/content/flagged', { params });
      const data = response.data?.data || {};
      const posts = data.content || [];

      const content: Content[] = posts.map((post: any) => ({
        _id: post._id,
        type: 'post' as const,
        title: post.title,
        content: post.bodyMarkdown || post.content || '',
        author: post.author?.username || post.author?.name || 'Unknown',
        authorId: post.author?._id || post.authorUid || post.authorId,
        status: (post.status === 'approved' ? 'visible' : post.status === 'rejected' ? 'removed' : 'flagged') as Content['status'],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        reports: post.reports || 0,
      }));

      return {
        content,
        total: data.pagination?.totalContent || content.length || 0,
        page: data.pagination?.currentPage || params?.page || 1,
        limit: data.pagination?.limit || params?.limit || 20,
      };
    } catch (error) {
      console.error('Failed to fetch content:', error);
      return {
        content: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  },

  moderateContent: async (
    contentId: string,
    action: 'approve' | 'reject' | 'delete',
    reason?: string,
    type?: 'post' | 'comment'
  ): Promise<void> => {
    await api.post(`/admin/content/${contentId}/moderate`, { action, reason, type });
  },

  deleteContent: async (contentId: string, type: 'post' | 'comment'): Promise<void> => {
    if (type === 'post') {
      await api.delete(`/community/forum/posts/${contentId}`);
    } else {
      await api.delete(`/community/forum/comments/${contentId}`);
    }
  },

  // System Health
  getSystemHealth: async (): Promise<any> => {
    const response = await api.get('/admin/system/health');
    return response.data.data;
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<any> => {
    const response = await api.get('/admin/analytics/overview');
    return response.data.data;
  },

  // Recent Activity
  getRecentActivity: async (limit?: number): Promise<{
    activities: Array<{
      id: string;
      kind: 'user_joined' | 'report_resolved' | 'report_submitted' | 'post_created';
      message: string;
      ts: number;
    }>;
    total: number;
  }> => {
    const response = await api.get('/admin/activity/recent', {
      params: { limit: limit || 50 }
    });
    return response.data.data;
  },

  // Maintenance
  clearCache: async (): Promise<void> => {
    await api.post('/admin/maintenance/cache-clear');
  },

  createBackup: async (): Promise<any> => {
    const response = await api.post('/admin/maintenance/backup');
    return response.data.data;
  },
};
