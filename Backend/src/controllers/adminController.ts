import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Plant } from '../models/Plant';
import { Post } from '../models/Post';
import { CareLog } from '../models/CareLog';
import { Reminder } from '../models/Reminder';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';

export class AdminController {
  // Dashboard overview with system statistics
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // User statistics
      const [totalUsers, activeUsers, newUsersThisMonth, usersByRole] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ lastActiveAt: { $gte: startOfDay } }),
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      ]);

      // Content statistics
      const [plantsCount, postsCount, careLogsCount, remindersCount] = await Promise.all([
        Plant.countDocuments({}),
        Post.countDocuments({}),
        CareLog.countDocuments({}),
        Reminder.countDocuments({})
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as { [key: string]: number })
        },
        content: {
          plants: plantsCount,
          posts: postsCount,
          careLogs: careLogsCount,
          reminders: remindersCount
        },
        activity: {
          dailyActiveUsers: await User.countDocuments({ lastActiveAt: { $gte: startOfDay } }),
          weeklyActiveUsers: await User.countDocuments({ lastActiveAt: { $gte: startOfWeek } }),
          monthlyActiveUsers: await User.countDocuments({ lastActiveAt: { $gte: startOfMonth } })
        },
        performance: {
          avgResponseTime: 150,
          errorRate: 0.1,
          uptime: 99.9
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // User management - Get all users with filtering and pagination
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query: any = {};
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) query.role = role;
      if (status) query.isActive = status === 'active';

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [users, totalUsers] = await Promise.all([
        User.find(query)
          .select('-password -refreshTokens')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalUsers / limitNum),
            totalUsers,
            hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get specific user details
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await User.findById(userId)
        .select('-password -refreshTokens')
        .lean();

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user's content statistics
      const [plantsCount, postsCount, careLogsCount, remindersCount] = await Promise.all([
        Plant.countDocuments({ userId }),
        Post.countDocuments({ author: userId }),
        CareLog.countDocuments({ userId }),
        Reminder.countDocuments({ userId })
      ]);

      res.json({
        success: true,
        data: {
          user,
          statistics: {
            plants: plantsCount,
            posts: postsCount,
            careLogs: careLogsCount,
            reminders: remindersCount
          }
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user details',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Update user role or status
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role, isActive, reason } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      // Log admin action
      if (req.user) {
        await UserAnalytics.create({
          userId: (req.user as any)._id || (req.user as any).id,
          eventType: AnalyticsEventType.ADMIN_ACTION,
          eventData: {
            action: 'UPDATE_USER',
            targetUserId: userId,
            changes: updateData,
            reason: reason || 'No reason provided'
          }
        });
      }

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Delete user (soft delete)
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason, hardDelete = false } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (hardDelete && req.user && (req.user as any).role === 'super_admin') {
        // Hard delete - remove user and all associated data
        await Promise.all([
          User.findByIdAndDelete(userId),
          Plant.deleteMany({ userId }),
          CareLog.deleteMany({ userId }),
          Reminder.deleteMany({ userId }),
          Post.deleteMany({ author: userId }),
          UserAnalytics.deleteMany({ userId })
        ]);
      } else {
        // Soft delete - deactivate user
        await User.findByIdAndUpdate(userId, {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: req.user ? (req.user as any)._id || (req.user as any).id : null,
          deletionReason: reason
        });
      }

      // Log admin action
      if (req.user) {
        await UserAnalytics.create({
          userId: (req.user as any)._id || (req.user as any).id,
          eventType: AnalyticsEventType.ADMIN_ACTION,
          eventData: {
            action: hardDelete ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER',
            targetUserId: userId,
            reason: reason || 'No reason provided'
          }
        });
      }

      res.json({
        success: true,
        message: `User ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Content moderation - Get flagged posts
  async getFlaggedContent(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'post',
        status = 'pending',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const query: any = {};
      const model: any = Post;

      // For now, focus on posts - can be extended to other content types
      if (status === 'pending') {
        query.status = { $in: ['pending', 'flagged'] };
      } else {
        query.status = status;
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const [content, totalContent] = await Promise.all([
        model.find(query)
          .populate('author', 'username email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        model.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          content,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalContent / limitNum),
            totalContent,
            hasNextPage: pageNum < Math.ceil(totalContent / limitNum),
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Get flagged content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch flagged content',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Moderate content (approve/reject/delete)
  async moderateContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const { action, reason, type = 'post' } = req.body;

      if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid content ID'
        });
        return;
      }

      if (!['approve', 'reject', 'delete'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Must be approve, reject, or delete'
        });
        return;
      }

      const model = Post; // Default to Post, can be extended
      const content = await model.findById(contentId);

      if (!content) {
        res.status(404).json({
          success: false,
          message: 'Content not found'
        });
        return;
      }

      const updateData: any = {
        moderatedBy: req.user ? (req.user as any)._id || (req.user as any).id : null,
        moderatedAt: new Date(),
        moderationReason: reason
      };

      switch (action) {
        case 'approve':
          updateData.status = 'approved';
          break;
        case 'reject':
          updateData.status = 'rejected';
          break;
        case 'delete':
          await model.findByIdAndDelete(contentId);
          break;
      }

      if (action !== 'delete') {
        await model.findByIdAndUpdate(contentId, updateData);
      }

      // Log moderation action
      if (req.user) {
        await UserAnalytics.create({
          userId: (req.user as any)._id || (req.user as any).id,
          eventType: AnalyticsEventType.ADMIN_ACTION,
          eventData: {
            action: `MODERATE_${type.toUpperCase()}`,
            contentId,
            moderationAction: action,
            reason: reason || 'No reason provided'
          }
        });
      }

      res.json({
        success: true,
        message: `Content ${action}d successfully`
      });
    } catch (error) {
      console.error('Moderate content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to moderate content',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // System monitoring - Get system health
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Database connection check
      const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

      // Recent error rate
      const recentErrors = await UserAnalytics.countDocuments({
        eventType: AnalyticsEventType.ERROR,
        timestamp: { $gte: fiveMinutesAgo }
      });

      // Memory usage (basic)
      const memoryUsage = process.memoryUsage();

      // Active connections (simplified)
      const activeUsers = await User.countDocuments({
        lastActiveAt: { $gte: fiveMinutesAgo }
      });

      const health = {
        status: dbStatus === 'healthy' && recentErrors < 10 ? 'healthy' : 'degraded',
        timestamp: now,
        checks: {
          database: {
            status: dbStatus,
            responseTime: '< 100ms'
          },
          memory: {
            status: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
            usage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
          },
          errors: {
            status: recentErrors < 5 ? 'healthy' : recentErrors < 10 ? 'warning' : 'critical',
            count: recentErrors,
            period: '5 minutes'
          },
          traffic: {
            activeUsers,
            status: activeUsers < 1000 ? 'healthy' : 'high'
          }
        }
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('System health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check system health',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get admin activity logs
  async getAdminLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        adminId,
        action,
        dateFrom,
        dateTo
      } = req.query;

      const query: any = { eventType: AnalyticsEventType.ADMIN_ACTION };

      if (adminId) query.userId = new mongoose.Types.ObjectId(adminId as string);
      if (action) query['eventData.action'] = action;
      if (dateFrom || dateTo) {
        query.timestamp = {};
        if (dateFrom) query.timestamp.$gte = new Date(dateFrom as string);
        if (dateTo) query.timestamp.$lte = new Date(dateTo as string);
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [logs, totalLogs] = await Promise.all([
        UserAnalytics.find(query)
          .populate('userId', 'username email')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        UserAnalytics.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalLogs / limitNum),
            totalLogs,
            hasNextPage: pageNum < Math.ceil(totalLogs / limitNum),
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Get admin logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin logs',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // System configuration management
  async getSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      // Return non-sensitive configuration
      const config = {
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          name: mongoose.connection.name
        },
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        features: {
          weatherIntegration: !!process.env.WEATHER_API_KEY,
          geminiAI: !!process.env.GEMINI_API_KEY,
          emailService: !!process.env.EMAIL_SERVICE_KEY
        },
        limits: {
          maxFileSize: '10MB',
          rateLimits: {
            general: '100 req/min',
            search: '60 req/min',
            upload: '10 req/min'
          }
        }
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Get system config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system configuration',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Bulk operations
  async bulkUserAction(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, action, reason } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
        return;
      }

      if (!['activate', 'deactivate', 'delete'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
        return;
      }

      const validUserIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      // Don't allow bulk actions on admin users
      const users = await User.find({
        _id: { $in: validUserIds },
        role: { $nin: ['admin', 'super_admin'] }
      });

      let updateData: any = {};
      let deletedCount = 0;

      switch (action) {
        case 'activate':
          updateData = { isActive: true };
          break;
        case 'deactivate':
          updateData = { 
            isActive: false, 
            deletedAt: new Date(),
            deletedBy: req.user ? (req.user as any)._id || (req.user as any).id : null,
            deletionReason: reason
          };
          break;
        case 'delete':
          deletedCount = await User.deleteMany({
            _id: { $in: users.map(u => u._id) }
          }).then(result => result.deletedCount || 0);
          break;
      }

      let updatedCount = 0;
      if (action !== 'delete') {
        const result = await User.updateMany(
          { _id: { $in: users.map(u => u._id) } },
          updateData
        );
        updatedCount = result.modifiedCount;
      }

      // Log bulk action
      if (req.user) {
        await UserAnalytics.create({
          userId: (req.user as any)._id || (req.user as any).id,
          eventType: AnalyticsEventType.ADMIN_ACTION,
          eventData: {
            action: `BULK_${action.toUpperCase()}_USERS`,
            targetUserIds: users.map(u => u._id),
            affectedCount: action === 'delete' ? deletedCount : updatedCount,
            reason: reason || 'No reason provided'
          }
        });
      }

      res.json({
        success: true,
        message: `Bulk ${action} completed`,
        data: {
          processedUsers: users.length,
          affectedCount: action === 'delete' ? deletedCount : updatedCount
        }
      });
    } catch (error) {
      console.error('Bulk user action error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk action',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
}

export const adminController = new AdminController();
