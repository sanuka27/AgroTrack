import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';
import { CommunityVote } from '../models/CommunityVote';
import { CommunityReport } from '../models/CommunityReport';
import { Plant } from '../models/Plant';

// Escape regex special characters in user input to avoid unintended patterns
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
      const [postsCount, plantsCount] = await Promise.all([
        CommunityPost.countDocuments({}),
        Plant.countDocuments({})
      ]);
      const careLogsCount = 0; // Model removed
      const remindersCount = 0; // Model removed

      // Reports statistics
      const [pendingReports, totalReports] = await Promise.all([
        CommunityReport.countDocuments({ status: { $in: ['open', 'pending'] } }),
        CommunityReport.countDocuments({})
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
        reports: {
          pending: pendingReports,
          total: totalReports
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
        const s = String(search).trim();
        // Only apply search if there's something after trimming
        if (s.length > 0) {
          // If search is 2+ chars, prefer prefix matching on name for a "typeahead" feel
          // e.g. 'Sa' matches names starting with 'Sa'. For single-char searches use contains.
          const nameRegex = s.length >= 2 ? new RegExp('^' + escapeRegex(s), 'i') : new RegExp(escapeRegex(s), 'i');
          const emailRegex = new RegExp(escapeRegex(s), 'i');

          query.$or = [
            { name: { $regex: nameRegex } },
            { email: { $regex: emailRegex } }
          ];
        }
      }

      if (role) query.role = role;
      // Map status filters: frontend may send 'active'|'pending'|'banned'|'inactive'
      if (status) {
        const s = String(status);
        if (s === 'active') {
          query.isActive = true;
        } else if (s === 'inactive') {
          query.isActive = false;
        } else if (s === 'banned') {
          // Frontend marks banned users by setting isActive=false, so filter by that
          query.isActive = false;
        } else if (s === 'pending') {
          query.isEmailVerified = false;
        }
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let users: any[] = [];
      let totalUsers = 0;

      // If we have an active search, use aggregation to prioritize prefix matches for name
      if (query.$or) {
        const s = String(search).trim();
        const prefixRegex = new RegExp('^' + escapeRegex(s), 'i');
        const containsRegex = new RegExp(escapeRegex(s), 'i');

        const matchStage: any = { $match: query };

        const addFieldsStage = {
          $addFields: {
            prefixMatch: { $regexMatch: { input: '$name', regex: prefixRegex } }
          }
        };

        const sortStage: any = { $sort: Object.assign({ prefixMatch: -1 }, sortOptions) };

        const projectStage = { $project: { password: 0, refreshTokens: 0 } };

        const pipeline = [matchStage, addFieldsStage, sortStage, { $skip: skip }, { $limit: limitNum }, projectStage];

        const [aggResults, count] = await Promise.all([
          User.aggregate(pipeline),
          User.countDocuments(Object.assign({}, query))
        ]);

        users = aggResults;
        totalUsers = count;
      } else {
        // No search term: regular find with pagination
        [users, totalUsers] = await Promise.all([
          User.find(query)
            .select('-password -refreshTokens')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          User.countDocuments(query)
        ]);
      }

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

      // Get user's content statistics (Removed models: Plant, CareLog, Reminder)
      const [postsCount] = await Promise.all([
        CommunityPost.countDocuments({ authorId: userId })
      ]);
      const plantsCount = 0; // Model removed
      const careLogsCount = 0; // Model removed
      const remindersCount = 0; // Model removed

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
      const { name, email, role, isActive, reason } = req.body;

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

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email, _id: { $ne: userId } });
        if (emailExists) {
          res.status(400).json({
            success: false,
            message: 'Email is already in use by another user'
          });
          return;
        }
      }

      const updateData: any = {};
      if (name !== undefined && name.trim()) updateData.name = name.trim();
      if (email !== undefined && email.trim()) updateData.email = email.trim().toLowerCase();
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      // Log admin action (UserAnalytics model removed)
      // if (req.user) {
      //   await UserAnalytics.create({
      //     userId: (req.user as any)._id || (req.user as any).id,
      //     eventType: AnalyticsEventType.ADMIN_ACTION,
      //     eventData: {
      //       action: 'UPDATE_USER',
      //       targetUserId: userId,
      //       changes: updateData,
      //       reason: reason || 'No reason provided'
      //     }
      //   });
      // }

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
  const { reason, hardDelete = false } = req.body || {};

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
        // Hard delete - remove user and all associated data (Removed models: Plant, CareLog, Reminder, UserAnalytics)
        await Promise.all([
          User.findByIdAndDelete(userId),
          CommunityPost.deleteMany({ authorId: userId }),
          CommunityComment.deleteMany({ authorId: userId }),
          CommunityVote.deleteMany({ userId })
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

      // Log admin action (UserAnalytics model removed)
      // if (req.user) {
      //   await UserAnalytics.create({
      //     userId: (req.user as any)._id || (req.user as any).id,
      //     eventType: AnalyticsEventType.ADMIN_ACTION,
      //     eventData: {
      //       action: hardDelete ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER',
      //       targetUserId: userId,
      //       reason: reason || 'No reason provided'
      //     }
      //   });
      // }

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
      const model: any = CommunityPost; // Changed from Post model

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

      const model = CommunityPost; // Changed from Post to CommunityPost
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

      // Log moderation action (UserAnalytics model removed)
      // if (req.user) {
      //   await UserAnalytics.create({
      //     userId: (req.user as any)._id || (req.user as any).id,
      //     eventType: AnalyticsEventType.ADMIN_ACTION,
      //     eventData: {
      //       action: `MODERATE_${type.toUpperCase()}`,
      //       contentId,
      //       moderationAction: action,
      //       reason: reason || 'No reason provided'
      //     }
      //   });
      // }

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

      // Recent error rate (UserAnalytics model removed)
      const recentErrors = 0; // await UserAnalytics.countDocuments({
      //   eventType: AnalyticsEventType.ERROR,
      //   timestamp: { $gte: fiveMinutesAgo }
      // });

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

      const query: any = {}; // { eventType: AnalyticsEventType.ADMIN_ACTION }; // UserAnalytics removed

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

      // UserAnalytics model removed - returning empty logs
      const logs: any[] = [];
      const totalLogs = 0;
      // const [logs, totalLogs] = await Promise.all([
      //   UserAnalytics.find(query)
      //     .populate('userId', 'username email')
      //     .sort({ timestamp: -1 })
      //     .skip(skip)
      //     .limit(limitNum)
      //     .lean(),
      //   UserAnalytics.countDocuments(query)
      // ]);

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

      // Log bulk action (UserAnalytics model removed)
      // if (req.user) {
      //   await UserAnalytics.create({
      //     userId: (req.user as any)._id || (req.user as any).id,
      //     eventType: AnalyticsEventType.ADMIN_ACTION,
      //     eventData: {
      //       action: `BULK_${action.toUpperCase()}_USERS`,
      //       targetUserIds: users.map(u => u._id),
      //       affectedCount: action === 'delete' ? deletedCount : updatedCount,
      //       reason: reason || 'No reason provided'
      //     }
      //   });
      // }

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

  // Get recent activity from database
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      // Combine all activities
      const activities: Array<{
        id: string;
        kind: 'user_joined' | 'report_resolved' | 'report_submitted' | 'post_created' | 'admin_action' | 'user_updated' | 'post_deleted';
        message: string;
        ts: number;
      }> = [];

      // 1. Fetch recent user registrations (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentUsers = await User.find({
        createdAt: { $gte: sevenDaysAgo }
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('name createdAt')
        .lean();

      recentUsers.forEach((user) => {
        activities.push({
          id: `user_${user._id}`,
          kind: 'user_joined',
          message: `${user.name} joined the community`,
          ts: new Date(user.createdAt).getTime()
        });
      });

      // 2. Fetch recent reports (submitted)
      const recentReports = await CommunityReport.find({
        createdAt: { $gte: sevenDaysAgo }
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('reporterId', 'name')
        .lean();

      recentReports.forEach((report: any) => {
        const reporterName = report.reporterId?.name || 'Anonymous';
        activities.push({
          id: `report_sub_${report._id}`,
          kind: 'report_submitted',
          message: `${reporterName} submitted a ${report.reportType} report`,
          ts: new Date(report.createdAt).getTime()
        });
      });

      // 3. Fetch resolved/dismissed reports
      const resolvedReports = await CommunityReport.find({
        status: { $in: ['resolved', 'dismissed'] },
        updatedAt: { $gte: sevenDaysAgo }
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .populate('resolvedBy', 'name')
        .lean();

      resolvedReports.forEach((report: any) => {
        const adminName = report.resolvedBy?.name || 'Admin';
        const action = report.status === 'resolved' ? 'resolved' : 'dismissed';
        activities.push({
          id: `report_res_${report._id}`,
          kind: 'report_resolved',
          message: `${adminName} ${action} a ${report.reportType} report`,
          ts: new Date(report.updatedAt).getTime()
        });
      });

      // 4. Fetch recently deleted/moderated posts
      const moderatedPosts = await CommunityPost.find({
        status: { $in: ['hidden', 'deleted'] },
        updatedAt: { $gte: sevenDaysAgo }
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .populate('authorId', 'name')
        .lean();

      moderatedPosts.forEach((post: any) => {
        const authorName = post.authorId?.name || 'Unknown';
        activities.push({
          id: `post_mod_${post._id}`,
          kind: 'post_deleted',
          message: `Post by ${authorName} was ${post.status}`,
          ts: new Date(post.updatedAt).getTime()
        });
      });

      // 5. Fetch recent user role/status changes (users updated by admin)
      const recentlyUpdatedUsers = await User.find({
        updatedAt: { $gte: sevenDaysAgo },
        // Only include if updated significantly after creation (admin action)
        $expr: {
          $gt: [
            { $subtract: ['$updatedAt', '$createdAt'] },
            60000 // More than 1 minute after creation
          ]
        }
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('name role isActive updatedAt')
        .lean();

      recentlyUpdatedUsers.forEach((user) => {
        const status = user.isActive ? 'activated' : 'deactivated';
        activities.push({
          id: `user_upd_${user._id}`,
          kind: 'admin_action',
          message: `User ${user.name} was ${status} by admin`,
          ts: new Date(user.updatedAt).getTime()
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => b.ts - a.ts);

      // Return limited results
      res.json({
        success: true,
        data: {
          activities: activities.slice(0, limit),
          total: activities.length
        }
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activity',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get all community posts for content management
  async getCommunityPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query: any = {};
      
      // Filter by status if provided
      if (status && status !== 'all') {
        query.status = status;
      }

      // Search in title, body, or author name
      if (search) {
        const searchStr = String(search).trim();
        if (searchStr.length > 0) {
          query.$or = [
            { title: { $regex: searchStr, $options: 'i' } },
            { body: { $regex: searchStr, $options: 'i' } },
            { authorName: { $regex: searchStr, $options: 'i' } }
          ];
        }
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [posts, totalPosts] = await Promise.all([
        CommunityPost.find(query)
          .populate('authorId', 'name email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        CommunityPost.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalPosts / limitNum),
            totalPosts,
            hasNextPage: pageNum < Math.ceil(totalPosts / limitNum),
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Get community posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch community posts',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Update community post status (hide/show/delete)
  async updateCommunityPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { status, reason } = req.body;

      if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID'
        });
        return;
      }

      if (!['visible', 'hidden', 'deleted'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be visible, hidden, or deleted'
        });
        return;
      }

      const post = await CommunityPost.findById(postId);
      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      const updateData: any = { status };
      
      if (status === 'deleted') {
        updateData.deletedAt = new Date();
        updateData.deletedBy = req.user ? (req.user as any)._id?.toString() || (req.user as any).id : null;
      }

      const updatedPost = await CommunityPost.findByIdAndUpdate(
        postId,
        updateData,
        { new: true, runValidators: true }
      );

      // Log admin action (UserAnalytics model removed)
      // if (req.user) {
      //   await UserAnalytics.create({
      //     userId: (req.user as any)._id || (req.user as any).id,
      //     eventType: AnalyticsEventType.ADMIN_ACTION,
      //     eventData: {
      //       action: 'UPDATE_COMMUNITY_POST',
      //       targetPostId: postId,
      //       newStatus: status,
      //       reason: reason || 'No reason provided'
      //     }
      //   });
      // }

      res.json({
        success: true,
        data: { post: updatedPost },
        message: `Post ${status === 'deleted' ? 'deleted' : status === 'hidden' ? 'hidden' : 'restored'} successfully`
      });
    } catch (error) {
      console.error('Update community post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Update a report (community report or bug report) - resolve or dismiss
  async updateReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      if (!id) { res.status(400).json({ success: false, message: 'Report ID required' }); return; }
      if (!['resolved', 'dismissed', 'pending'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status' }); return;
      }

      // Try community reports first
      const { CommunityReport } = await import('../models/CommunityReport');
      const { BugReport } = await import('../models/BugReport');

      const isObjectId = mongoose.Types.ObjectId.isValid(id);

      let updated: any = null;

      if (isObjectId) {
        // Update community report if exists
        const comm = await CommunityReport.findById(id);
        if (comm) {
          comm.status = status === 'dismissed' ? 'dismissed' : (status === 'resolved' ? 'resolved' : status as any);
          comm.reviewedBy = req.user ? (req.user as any)._id?.toString() || (req.user as any).id : null;
          comm.reviewedAt = new Date();
          if (adminNote) comm.reviewNotes = adminNote;
          updated = await comm.save();
        }
      }

      // If not community report, try bug report by id string (could be same)
      if (!updated) {
        const bug = await BugReport.findById(id);
        if (bug) {
          // Map dismissed -> closed, resolved -> resolved
          bug.status = status === 'dismissed' ? 'closed' : (status === 'resolved' ? 'resolved' : status as any);
          bug.assignedTo = req.user ? (req.user as any)._id?.toString() || (req.user as any).id : bug.assignedTo;
          if (adminNote) bug.resolution = adminNote;
          updated = await bug.save();
        }
      }

      if (!updated) {
        res.status(404).json({ success: false, message: 'Report not found' }); return;
      }

      // Emit activity or log (omitted for brevity)

      res.json({ success: true, data: { report: updated } });
    } catch (error) {
      console.error('Failed to update report:', error);
      res.status(500).json({ success: false, message: 'Failed to update report' });
    }
  }

  // Delete community post (hard delete)
  async deleteCommunityPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { reason } = req.body || {};

      if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID'
        });
        return;
      }

      const post = await CommunityPost.findById(postId);
      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      // Hard delete the post
      await CommunityPost.findByIdAndDelete(postId);

      // Log admin action (UserAnalytics model removed)
      // if (req.user) {
      //   await UserAnalytics.create({
      //     userId: (req.user as any)._id || (req.user as any).id,
      //     eventType: AnalyticsEventType.ADMIN_ACTION,
      //     eventData: {
      //       action: 'DELETE_COMMUNITY_POST',
      //       targetPostId: postId,
      //       postTitle: post.title,
      //       reason: reason || 'No reason provided'
      //     }
      //   });
      // }

      res.json({
        success: true,
        message: 'Post permanently deleted successfully'
      });
    } catch (error) {
      console.error('Delete community post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // ==================== PLANT MANAGEMENT ====================

  /**
   * Get all plants (admin only)
   * GET /api/admin/plants
   */
  async getPlants(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        health,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query: any = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { species: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      if (health) {
        query.health = health;
      }

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Sort
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Fetch plants with user information
      const [plants, totalPlants] = await Promise.all([
        Plant.find(query)
          .populate('userId', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Plant.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalPlants / limitNum);

      res.json({
        success: true,
        data: {
          plants: plants.map(plant => ({
            ...plant,
            ownerName: (plant.userId as any)?.name || 'Unknown',
            ownerEmail: (plant.userId as any)?.email || 'N/A'
          })),
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalPlants,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Get plants error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plants',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get a single plant by ID (admin only)
   * GET /api/admin/plants/:id
   */
  async getPlant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid plant ID'
        });
        return;
      }

      const plant = await Plant.findById(id)
        .populate('userId', 'name email role')
        .lean();

      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          plant: {
            ...plant,
            ownerName: (plant.userId as any)?.name || 'Unknown',
            ownerEmail: (plant.userId as any)?.email || 'N/A',
            ownerRole: (plant.userId as any)?.role || 'user'
          }
        }
      });
    } catch (error) {
      console.error('Get plant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plant',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Delete a plant (admin only)
   * DELETE /api/admin/plants/:id
   */
  async deletePlant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid plant ID'
        });
        return;
      }

      const plant = await Plant.findById(id);
      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found'
        });
        return;
      }

      // Delete the plant
      await Plant.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Plant permanently deleted successfully'
      });
    } catch (error) {
      console.error('Delete plant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete plant',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
}

export const adminController = new AdminController();
