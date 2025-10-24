import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';
import { logger } from '../config/logger';
import path from 'path';
import { firebaseService } from '../config/firebase';

// Extended Request interfaces for type safety
interface UpdateProfileRequest extends Request {
  body: {
    name?: string;
    email?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    language?: string;
  };
}

interface UpdatePreferencesRequest extends Request {
  body: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      careReminders?: boolean;
      communityUpdates?: boolean;
      systemUpdates?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'private';
      showEmail?: boolean;
      showLocation?: boolean;
      allowSearchEngineIndexing?: boolean;
    };
    plantCare?: {
      defaultWateringInterval?: number;
      defaultFertilizingInterval?: number;
      preferredUnits?: 'metric' | 'imperial';
      reminderTime?: string;
      reminderDays?: string[];
    };
    dashboard?: {
      showQuickStats?: boolean;
      showRecentActivity?: boolean;
      showUpcomingReminders?: boolean;
      showWeatherWidget?: boolean;
      defaultView?: 'grid' | 'list';
    };
  };
}

interface ChangePasswordRequest extends Request {
  body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
}

interface UpdateRoleRequest extends Request {
  body: {
    userId: string;
    role: 'guest' | 'user' | 'admin';
    reason?: string;
  };
}

interface SearchUsersRequest extends Request {
  query: {
    q?: string;
    role?: string;
    verified?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export class UserController {
  /**
   * Get current user's profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Defensive check: ensure req.user exists before accessing _id
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const user = await User.findById(new mongoose.Types.ObjectId((req.user as any)._id!.toString()))
        .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
        .populate('stats');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Track profile view
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.PROFILE_VIEWED,
          {
            source: 'user_action',
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track profile view event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            bio: user.bio,
            location: user.location,
            timezone: user.timezone,
            language: user.language,
            authProvider: user.authProvider,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
            preferences: user.preferences,
            stats: user.stats
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: UpdateProfileRequest, res: Response, next: NextFunction): Promise<void> {
    try {
  const { name, email, avatar, bio, location, timezone, language } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Check if email is being changed and if it's already in use
      if (email) {
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: userId }
        });

        if (existingUser) {
          res.status(400).json({
            success: false,
            message: 'Email address is already in use'
          });
          return;
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) {
        updateData.email = email.toLowerCase();
        updateData.isEmailVerified = false; // Re-verify email if changed
      }
      // If an avatar file was uploaded via multipart, upload it to Firebase and set the avatar URL
      if (req.file) {
        try {
          const bucket = firebaseService.getStorage().bucket();
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `profile-${userId.toString()}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
          const file = bucket.file(`profile-pictures/${filename}`);

          // Upload buffer
          await file.save(req.file.buffer, {
            metadata: {
              contentType: req.file.mimetype,
              metadata: {
                originalName: req.file.originalname,
                userId: userId.toString(),
                uploadDate: new Date().toISOString()
              }
            },
            validation: 'md5'
          });

          // Make public and construct URL
          await file.makePublic();
          const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          updateData.avatar = avatarUrl;
        } catch (uploadError) {
          logger.error('Failed to upload profile avatar to Firebase', { error: uploadError });
          // Do not fail the entire profile update if avatar upload fails; return a warning in response
          // but continue to update other fields.
        }
      } else if (avatar !== undefined) updateData.avatar = avatar;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (language !== undefined) updateData.language = language;
  // theme removed from profile

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -refreshToken -emailVerificationToken -passwordResetToken');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Track profile update
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.PROFILE_UPDATED,
          {
            fieldsUpdated: Object.keys(updateData),
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track profile update event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(req: UpdatePreferencesRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { notifications, privacy, plantCare, dashboard } = req.body;

      const updateData: any = {};
      if (notifications !== undefined) updateData['preferences.notifications'] = notifications;
      if (privacy !== undefined) updateData['preferences.privacy'] = privacy;
      if (plantCare !== undefined) updateData['preferences.plantCare'] = plantCare;
      if (dashboard !== undefined) updateData['preferences.dashboard'] = dashboard;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('preferences');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Track preferences update
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.PREFERENCES_UPDATED,
          {
            sections: Object.keys(req.body),
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track preferences update event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences: user.preferences }
      });
    } catch (error) {
      logger.error('Update preferences error:', error);
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: ChangePasswordRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match'
        });
        return;
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password!);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and security fields
      user.password = hashedNewPassword;
      user.passwordChangedAt = new Date();
      user.refreshTokens = []; // Invalidate all refresh tokens

      await user.save();

      // Track password change
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.PASSWORD_CHANGED,
          {
            sessionId: req.sessionID,
            timestamp: new Date()
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track password change event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Find and delete user
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Track account deletion
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.ACCOUNT_DELETED,
          {
            sessionId: req.sessionID,
            deletionTimestamp: new Date()
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track account deletion event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      const analytics = await UserAnalytics.findOne({ userId })
        .select('totalPlants totalCareLogs streakDays achievements activityScore');

      if (!analytics) {
        res.status(404).json({
          success: false,
          message: 'User statistics not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { stats: analytics }
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      next(error);
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { email, push, sms, reminderNotifications, communityNotifications, systemNotifications, quietHoursStart, quietHoursEnd } = req.body;

      const updateData: any = {};
      if (email !== undefined) updateData['preferences.notifications.email'] = email;
      if (push !== undefined) updateData['preferences.notifications.push'] = push;
      if (sms !== undefined) updateData['preferences.notifications.sms'] = sms;
      if (reminderNotifications !== undefined) updateData['preferences.notifications.reminderNotifications'] = reminderNotifications;
      if (communityNotifications !== undefined) updateData['preferences.notifications.communityNotifications'] = communityNotifications;
      if (systemNotifications !== undefined) updateData['preferences.notifications.systemNotifications'] = systemNotifications;
      if (quietHoursStart !== undefined) updateData['preferences.notifications.quietHoursStart'] = quietHoursStart;
      if (quietHoursEnd !== undefined) updateData['preferences.notifications.quietHoursEnd'] = quietHoursEnd;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('preferences');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update notification preferences error:', error);
      next(error);
    }
  }

  // Admin-only endpoints

  /**
   * Get all users (Admin only)
   */
  static async getAllUsers(req: SearchUsersRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q = '',
        role,
        verified,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build search query
      const searchQuery: any = {};

      if (q) {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ];
      }

      if (role) {
        searchQuery.role = role;
      }

      if (verified !== undefined) {
        searchQuery.isEmailVerified = verified === 'true';
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [users, totalUsers] = await Promise.all([
        User.find(searchQuery)
          .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .populate('stats', 'totalPlants totalCareLogs streakDays activityScore'),
        User.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(totalUsers / limitNum);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalUsers,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  }

  /**
   * Update user role (Admin only)
   */
  static async updateUserRole(req: UpdateRoleRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role, reason } = req.body;
      const adminId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          role,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password -refreshToken -emailVerificationToken -passwordResetToken');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Track role change
      try {
        await UserAnalytics.trackEvent(
          new mongoose.Types.ObjectId(userId),
          AnalyticsEventType.ROLE_UPDATED,
          {
            newRole: role,
            updatedBy: adminId,
            reason: reason || 'No reason provided',
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track role update event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: { user }
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      next(error);
    }
  }

  /**
   * Delete user (Admin only)
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Prevent admin from deleting themselves
      if (userId === adminId.toString()) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
        return;
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Track user deletion by admin
      try {
        await UserAnalytics.trackEvent(
          new mongoose.Types.ObjectId(userId),
          AnalyticsEventType.USER_DELETED_BY_ADMIN,
          {
            deletedBy: adminId,
            sessionId: req.sessionID,
            deletionTimestamp: new Date()
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track admin user deletion event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      next(error);
    }
  }

  /**
   * Get user activity analytics (Admin only)
   */
  static async getUserAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const analytics = await UserAnalytics.findOne({ userId });
      if (!analytics) {
        res.status(404).json({
          success: false,
          message: 'User analytics not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      logger.error('Get user analytics error:', error);
      next(error);
    }
  }
}
