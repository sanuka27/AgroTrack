/**
 * Users API Module
 * 
 * Handles all user-related API operations:
 * - Get user profile
 * - Update profile
 * - Upload avatar
 * - Change password
 * - Update notification preferences
 * - Account management
 * 
 * Backend Endpoints: /api/users
 * MongoDB Collection: users
 */

import api, { getErrorMessage } from '../api';

/**
 * User type
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  avatar?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  authProvider?: 'local' | 'google' | 'firebase';
  preferences?: {
    // preferences shape kept minimal: notifications etc. Appearance removed
    language?: string;
  };
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    reminderNotifications: boolean;
    communityNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface UserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

/**
 * Users API Service
 */
export const usersApi = {
  /**
   * Get current user's profile
   * 
   * GET /api/users/profile
   * 
   * @returns Promise with user data
   */
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<UserResponse>('/users/profile');
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching profile:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update user profile
   * 
   * PUT /api/users/profile
   * 
   * @param profileData - Profile data to update
   * @returns Promise with updated user
   */
  async updateProfile(profileData: {
    name?: string;
    bio?: string;
    location?: string;
    phoneNumber?: string;
    preferences?: any;
  }): Promise<User> {
    try {
      const response = await api.put<UserResponse>('/users/profile', profileData);
      
      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      return response.data.data.user;
    } catch (error) {
      console.error('Error updating profile:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Upload user avatar/profile picture
   * 
   * POST /api/users/profile/avatar
   * 
   * @param imageFile - Avatar image file
   * @returns Promise with updated user
   */
  async uploadAvatar(imageFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);

      const response = await api.post<UserResponse>('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      return response.data.data.user;
    } catch (error) {
      console.error('Error uploading avatar:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete user avatar
   * 
   * DELETE /api/users/profile/avatar
   * 
   * @returns Promise with updated user
   */
  async deleteAvatar(): Promise<User> {
    try {
      const response = await api.delete<UserResponse>('/users/profile/avatar');

      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      return response.data.data.user;
    } catch (error) {
      console.error('Error deleting avatar:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Change user password
   * 
   * PUT /api/users/change-password
   * 
   * @param passwordData - Current and new password
   * @returns Promise that resolves when password is changed
   */
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    try {
      await api.put('/users/change-password', passwordData);
    } catch (error) {
      console.error('Error changing password:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update notification preferences
   * 
   * PUT /api/users/notification-preferences
   * 
   * @param preferences - Notification settings
   * @returns Promise with updated user
   */
  async updateNotificationPreferences(preferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    reminderNotifications?: boolean;
    communityNotifications?: boolean;
    systemNotifications?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }): Promise<User> {
    try {
      const response = await api.put<UserResponse>('/users/notification-preferences', preferences);
      return response.data.data.user;
    } catch (error) {
      console.error('Error updating preferences:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete user account
   * 
   * DELETE /api/users/account
   * 
   * @param password - User password for confirmation
   * @returns Promise that resolves when account is deleted
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      await api.delete('/users/account', {
        data: { password },
      });
      
      // Clear all auth data
      localStorage.clear();
    } catch (error) {
      console.error('Error deleting account:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get user statistics
   * 
   * GET /api/users/stats
   * 
   * @returns Promise with user stats
   */
  async getStats(): Promise<{ plantsCount: number; careLogsCount: number; remindersCount: number }> {
    try {
      const response = await api.get('/users/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching stats:', getErrorMessage(error));
      throw error;
    }
  },
};
