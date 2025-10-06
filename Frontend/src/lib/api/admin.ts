/**
 * Admin API Module
 * 
 * Handles all admin-related API operations:
 * - User management (get, update, delete users)
 * - System analytics and stats
 * - Content moderation (posts, comments)
 * - Bug reports management
 * - Contact messages management
 * 
 * Backend Endpoints: /api/admin
 * MongoDB Collections: users, posts, comments, analytics, bugreports, contactmessages
 */

import api, { getErrorMessage } from '../api';

/**
 * Admin User type with additional fields
 */
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'expert' | 'admin';
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  authProvider: 'local' | 'google' | 'facebook' | 'apple';
  lastLogin?: string;
  createdAt: string;
  stats?: {
    plants: number;
    posts: number;
    comments: number;
  };
}

/**
 * System analytics type
 */
export interface SystemAnalytics {
  users: {
    total: number;
    active: number;
    new: number;
    byRole: { user: number; expert: number; admin: number };
  };
  plants: {
    total: number;
    byStatus: { healthy: number; warning: number; critical: number };
  };
  posts: {
    total: number;
    published: number;
    draft: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
}

/**
 * Bug report type
 */
export interface BugReport {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  description: string;
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: {
    _id: string;
    name: string;
  };
  attachments?: string[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contact message type
 */
export interface ContactMessage {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'closed';
  priority: 'low' | 'normal' | 'high';
  response?: string;
  respondedAt?: string;
  respondedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsersListResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface UserResponse {
  success: boolean;
  data: {
    user: AdminUser;
  };
}

interface AnalyticsResponse {
  success: boolean;
  data: {
    analytics: SystemAnalytics;
  };
}

interface BugReportsListResponse {
  success: boolean;
  data: {
    reports: BugReport[];
    total?: number;
  };
}

interface BugReportResponse {
  success: boolean;
  data: {
    report: BugReport;
  };
}

interface ContactMessagesListResponse {
  success: boolean;
  data: {
    messages: ContactMessage[];
    total?: number;
  };
}

interface ContactMessageResponse {
  success: boolean;
  data: {
    message: ContactMessage;
  };
}

/**
 * Admin API Service
 */
export const adminApi = {
  // ==================== USER MANAGEMENT ====================

  /**
   * Get all users (admin only)
   * 
   * GET /api/admin/users
   * 
   * @param params - Query parameters
   * @returns Promise with array of users
   */
  async getUsers(params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: AdminUser[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append('role', params.role);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get<UsersListResponse>(`/admin/users?${queryParams.toString()}`);
      return {
        users: response.data.data.users,
        total: response.data.data.total || 0,
      };
    } catch (error) {
      console.error('Error fetching users:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single user by ID (admin only)
   * 
   * GET /api/admin/users/:id
   * 
   * @param id - User ID
   * @returns Promise with user data
   */
  async getUser(id: string): Promise<AdminUser> {
    try {
      const response = await api.get<UserResponse>(`/admin/users/${id}`);
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching user:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update user details (admin only)
   * 
   * PUT /api/admin/users/:id
   * 
   * @param id - User ID
   * @param userData - Updated user data
   * @returns Promise with updated user
   */
  async updateUser(
    id: string,
    userData: Partial<{
      name: string;
      email: string;
      role: 'user' | 'expert' | 'admin';
      isVerified: boolean;
      isActive: boolean;
    }>
  ): Promise<AdminUser> {
    try {
      const response = await api.put<UserResponse>(`/admin/users/${id}`, userData);
      return response.data.data.user;
    } catch (error) {
      console.error('Error updating user:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a user (admin only)
   * 
   * DELETE /api/admin/users/:id
   * 
   * @param id - User ID
   * @returns Promise that resolves when user is deleted
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/admin/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', getErrorMessage(error));
      throw error;
    }
  },

  // ==================== ANALYTICS ====================

  /**
   * Get system analytics (admin only)
   * 
   * GET /api/admin/analytics
   * 
   * @returns Promise with system analytics
   */
  async getAnalytics(): Promise<SystemAnalytics> {
    try {
      const response = await api.get<AnalyticsResponse>('/admin/analytics');
      return response.data.data.analytics;
    } catch (error) {
      console.error('Error fetching analytics:', getErrorMessage(error));
      throw error;
    }
  },

  // ==================== CONTENT MODERATION ====================

  /**
   * Delete a post (admin only)
   * 
   * DELETE /api/admin/posts/:id
   * 
   * @param id - Post ID
   * @returns Promise that resolves when post is deleted
   */
  async deletePost(id: string): Promise<void> {
    try {
      await api.delete(`/admin/posts/${id}`);
    } catch (error) {
      console.error('Error deleting post:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a comment (admin only)
   * 
   * DELETE /api/admin/comments/:id
   * 
   * @param id - Comment ID
   * @returns Promise that resolves when comment is deleted
   */
  async deleteComment(id: string): Promise<void> {
    try {
      await api.delete(`/admin/comments/${id}`);
    } catch (error) {
      console.error('Error deleting comment:', getErrorMessage(error));
      throw error;
    }
  },

  // ==================== BUG REPORTS ====================

  /**
   * Get all bug reports (admin only)
   * 
   * GET /api/admin/bug-reports
   * 
   * @param params - Query parameters
   * @returns Promise with array of bug reports
   */
  async getBugReports(params?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    reports: BugReport[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get<BugReportsListResponse>(`/admin/bug-reports?${queryParams.toString()}`);
      return {
        reports: response.data.data.reports,
        total: response.data.data.total || 0,
      };
    } catch (error) {
      console.error('Error fetching bug reports:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single bug report by ID (admin only)
   * 
   * GET /api/admin/bug-reports/:id
   * 
   * @param id - Bug report ID
   * @returns Promise with bug report data
   */
  async getBugReport(id: string): Promise<BugReport> {
    try {
      const response = await api.get<BugReportResponse>(`/admin/bug-reports/${id}`);
      return response.data.data.report;
    } catch (error) {
      console.error('Error fetching bug report:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update bug report (admin only)
   * 
   * PUT /api/admin/bug-reports/:id
   * 
   * @param id - Bug report ID
   * @param reportData - Updated report data
   * @returns Promise with updated bug report
   */
  async updateBugReport(
    id: string,
    reportData: Partial<{
      status: 'new' | 'investigating' | 'resolved' | 'closed';
      priority: 'low' | 'medium' | 'high' | 'critical';
      assignedTo: string;
      resolution: string;
    }>
  ): Promise<BugReport> {
    try {
      const response = await api.put<BugReportResponse>(`/admin/bug-reports/${id}`, reportData);
      return response.data.data.report;
    } catch (error) {
      console.error('Error updating bug report:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a bug report (admin only)
   * 
   * DELETE /api/admin/bug-reports/:id
   * 
   * @param id - Bug report ID
   * @returns Promise that resolves when bug report is deleted
   */
  async deleteBugReport(id: string): Promise<void> {
    try {
      await api.delete(`/admin/bug-reports/${id}`);
    } catch (error) {
      console.error('Error deleting bug report:', getErrorMessage(error));
      throw error;
    }
  },

  // ==================== CONTACT MESSAGES ====================

  /**
   * Get all contact messages (admin only)
   * 
   * GET /api/admin/contact-messages
   * 
   * @param params - Query parameters
   * @returns Promise with array of contact messages
   */
  async getContactMessages(params?: {
    status?: string;
    priority?: string;
    respondedBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    messages: ContactMessage[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.respondedBy) queryParams.append('respondedBy', params.respondedBy);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get<ContactMessagesListResponse>(`/admin/contact-messages?${queryParams.toString()}`);
      return {
        messages: response.data.data.messages,
        total: response.data.data.total || 0,
      };
    } catch (error) {
      console.error('Error fetching contact messages:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single contact message by ID (admin only)
   * 
   * GET /api/admin/contact-messages/:id
   * 
   * @param id - Contact message ID
   * @returns Promise with contact message data
   */
  async getContactMessage(id: string): Promise<ContactMessage> {
    try {
      const response = await api.get<ContactMessageResponse>(`/admin/contact-messages/${id}`);
      return response.data.data.message;
    } catch (error) {
      console.error('Error fetching contact message:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Respond to a contact message (admin only)
   * 
   * PUT /api/admin/contact-messages/:id/respond
   * 
   * @param id - Contact message ID
   * @param response - Response message
   * @returns Promise with updated contact message
   */
  async respondToContactMessage(id: string, response: string): Promise<ContactMessage> {
    try {
      const res = await api.put<ContactMessageResponse>(`/admin/contact-messages/${id}/respond`, { response });
      return res.data.data.message;
    } catch (error) {
      console.error('Error responding to contact message:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update contact message status (admin only)
   * 
   * PUT /api/admin/contact-messages/:id
   * 
   * @param id - Contact message ID
   * @param messageData - Updated message data
   * @returns Promise with updated contact message
   */
  async updateContactMessage(
    id: string,
    messageData: Partial<{
      status: 'new' | 'in_progress' | 'responded' | 'closed';
      priority: 'low' | 'normal' | 'high';
    }>
  ): Promise<ContactMessage> {
    try {
      const response = await api.put<ContactMessageResponse>(`/admin/contact-messages/${id}`, messageData);
      return response.data.data.message;
    } catch (error) {
      console.error('Error updating contact message:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a contact message (admin only)
   * 
   * DELETE /api/admin/contact-messages/:id
   * 
   * @param id - Contact message ID
   * @returns Promise that resolves when contact message is deleted
   */
  async deleteContactMessage(id: string): Promise<void> {
    try {
      await api.delete(`/admin/contact-messages/${id}`);
    } catch (error) {
      console.error('Error deleting contact message:', getErrorMessage(error));
      throw error;
    }
  },
};
