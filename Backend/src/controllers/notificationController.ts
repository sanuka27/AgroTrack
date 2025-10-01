import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { NotificationPreference, INotificationPreference } from '../models/NotificationPreference';
import { User } from '../models/User';
import { Plant } from '../models/Plant';
import { Reminder } from '../models/Reminder';
import { UserAnalytics } from '../models/UserAnalytics';
import { generateNotificationContent } from '../../ai/gemini';
import logger from '../config/logger';

// Interfaces for request types
interface AuthenticatedRequest extends Request {
  user?: any;
}

interface NotificationData {
  userId: mongoose.Types.ObjectId;
  type: 'reminder' | 'alert' | 'tip' | 'community' | 'expert' | 'system';
  title: string;
  message: string;
  channels: ('email' | 'push' | 'sms')[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  relatedEntity?: {
    type: 'plant' | 'reminder' | 'post' | 'consultation' | 'weather';
    id: mongoose.Types.ObjectId;
  };
  metadata?: any;
}

// Mock notification service functions (would be replaced with actual services)
class NotificationService {
  static async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    // Mock email sending - replace with actual email service (SendGrid, AWS SES, etc.)
    logger.info(`Mock email sent to ${to}: ${subject}`);
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.1), 1000));
  }

  static async sendPush(tokens: string[], title: string, body: string): Promise<boolean> {
    // Mock push notification - replace with actual push service (FCM, APNS, etc.)
    logger.info(`Mock push sent to ${tokens.length} devices: ${title}`);
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.1), 500));
  }

  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // Mock SMS sending - replace with actual SMS service (Twilio, AWS SNS, etc.)
    logger.info(`Mock SMS sent to ${phoneNumber}: ${message}`);
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.1), 800));
  }
}

// Create notification
export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, title, message, channels, priority, scheduledFor, relatedEntity, metadata } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Get user's notification preferences
    const preferences = await NotificationPreference.getOrCreateForUser(userId);
    
    // Filter channels based on user preferences
    const enabledChannels = channels.filter((channel: string) => 
      preferences.isNotificationEnabled(type, channel)
    );

    if (enabledChannels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No enabled notification channels for this notification type'
      });
    }

    // Create notification
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      channels: enabledChannels,
      priority: priority || 'medium',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      relatedEntity,
      metadata: {
        ...metadata,
        aiGenerated: false
      }
    });

    await notification.save();

    // Send immediately if not scheduled
    if (!scheduledFor) {
      await sendNotificationNow(notification);
    }

    // Update user analytics
    await UserAnalytics.findOneAndUpdate(
      { userId },
      { 
        $inc: { 
          'notificationStats.total': 1,
          [`notificationStats.byType.${type}`]: 1
        },
        $set: { lastActivity: new Date() }
      },
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notificationId: notification._id,
        status: notification.status,
        channels: notification.channels,
        scheduledFor: notification.scheduledFor
      }
    });

  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Create AI-generated notification
export const createAINotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, context, channels, priority, scheduledFor } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Check if AI features are enabled
    if (process.env.ENABLE_AI_FEATURES !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'AI features are not enabled'
      });
    }

    // Get user's notification preferences
    const preferences = await NotificationPreference.getOrCreateForUser(userId);
    
    // Filter channels based on user preferences
    const enabledChannels = channels.filter((channel: string) => 
      preferences.isNotificationEnabled(type, channel)
    );

    if (enabledChannels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No enabled notification channels for this notification type'
      });
    }

    // Generate AI content
    const aiContent = await generateNotificationContent(type, context);
    
    // Extract title and message from AI content
    const lines = aiContent.split('\n').filter(line => line.trim());
    const title = lines[0] || `Plant Care ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const message = lines.slice(1).join(' ') || aiContent;

    // Create notification
    const notification = new Notification({
      userId,
      type,
      title: title.substring(0, 100),
      message: message.substring(0, 500),
      channels: enabledChannels,
      priority: priority || 'medium',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      metadata: {
        ...context,
        aiGenerated: true
      }
    });

    await notification.save();

    // Send immediately if not scheduled
    if (!scheduledFor) {
      await sendNotificationNow(notification);
    }

    // Update user analytics
    await UserAnalytics.findOneAndUpdate(
      { userId },
      { 
        $inc: { 
          'notificationStats.total': 1,
          'notificationStats.aiGenerated': 1,
          [`notificationStats.byType.${type}`]: 1
        },
        $set: { lastActivity: new Date() }
      },
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'AI notification created successfully',
      data: {
        notificationId: notification._id,
        status: notification.status,
        channels: notification.channels,
        aiGenerated: true,
        content: {
          title: notification.title,
          message: notification.message
        }
      }
    });

  } catch (error) {
    logger.error('Error creating AI notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI notification',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get user notifications
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const type = req.query.type as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    // Build filter
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Get notifications
    const notifications = await Notification.getUserNotifications(userId, page, limit, filter);
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments({ userId, ...filter });
    const unreadCount = await Notification.getUnreadCount(userId);

    return res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        unreadCount
      }
    });

  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notificationId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.status === 'read') {
      return res.json({
        success: true,
        message: 'Notification already marked as read'
      });
    }

    await notification.markAsRead();

    // Update user analytics
    await UserAnalytics.findOneAndUpdate(
      { userId },
      { 
        $inc: { 'notificationStats.read': 1 },
        $set: { lastActivity: new Date() }
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notificationId: notification._id,
        readAt: notification.readAt
      }
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const result = await Notification.updateMany(
      { 
        userId, 
        status: { $in: ['sent', 'delivered'] }
      },
      { 
        status: 'read',
        readAt: new Date()
      }
    );

    // Update user analytics
    await UserAnalytics.findOneAndUpdate(
      { userId },
      { 
        $inc: { 'notificationStats.read': result.modifiedCount },
        $set: { lastActivity: new Date() }
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        markedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Delete notification
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notificationId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const preferences = await NotificationPreference.getOrCreateForUser(userId);

    return res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const updateData = req.body;

    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });

  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Add push token
export const addPushToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const preferences = await NotificationPreference.getOrCreateForUser(userId);
    await preferences.addPushToken(token);

    return res.json({
      success: true,
      message: 'Push token added successfully'
    });

  } catch (error) {
    logger.error('Error adding push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add push token',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Remove push token
export const removePushToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const preferences = await NotificationPreference.findOne({ userId });
    if (preferences) {
      await preferences.removePushToken(token);
    }

    return res.json({
      success: true,
      message: 'Push token removed successfully'
    });

  } catch (error) {
    logger.error('Error removing push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push token',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Send scheduled notifications (to be called by a cron job)
export const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    const scheduledNotifications = await Notification.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    }).limit(100);

    logger.info(`Processing ${scheduledNotifications.length} scheduled notifications`);

    for (const notification of scheduledNotifications) {
      await sendNotificationNow(notification);
    }

  } catch (error) {
    logger.error('Error processing scheduled notifications:', error);
  }
};

// Helper function to send notification immediately
async function sendNotificationNow(notification: INotification): Promise<void> {
  try {
    // Get user preferences to get contact details
    const preferences = await NotificationPreference.findOne({ userId: notification.userId });
    const user = await User.findById(notification.userId);

    if (!user || !preferences) {
      notification.status = 'failed';
      notification.metadata.failureReason = 'User or preferences not found';
      await notification.save();
      return;
    }

    const results: boolean[] = [];

    // Send via enabled channels
    for (const channel of notification.channels) {
      let success = false;

      switch (channel) {
        case 'email':
          if (preferences.emailAddress || user.email) {
            const emailAddress = preferences.emailAddress || user.email;
            success = await NotificationService.sendEmail(
              emailAddress,
              notification.title,
              notification.message
            );
          }
          break;

        case 'push':
          if (preferences.pushTokens.length > 0) {
            success = await NotificationService.sendPush(
              preferences.pushTokens,
              notification.title,
              notification.message
            );
          }
          break;

        case 'sms':
          if (preferences.phoneNumber) {
            success = await NotificationService.sendSMS(
              preferences.phoneNumber,
              `${notification.title}: ${notification.message}`
            );
          }
          break;
      }

      results.push(success);
    }

    // Update notification status
    const allSuccessful = results.every(result => result);
    const anySuccessful = results.some(result => result);

    if (allSuccessful) {
      notification.status = 'sent';
    } else if (anySuccessful) {
      notification.status = 'sent'; // Partial success still counts as sent
    } else {
      notification.status = 'failed';
      notification.metadata.failureReason = 'All delivery channels failed';
      notification.metadata.retryCount = (notification.metadata.retryCount || 0) + 1;
    }

    notification.sentAt = new Date();
    await notification.save();

  } catch (error) {
    logger.error('Error sending notification:', error);
    notification.status = 'failed';
    notification.metadata.failureReason = error instanceof Error ? error.message : 'Unknown error';
    notification.metadata.retryCount = (notification.metadata.retryCount || 0) + 1;
    await notification.save();
  }
}

// Validation rules
export const createNotificationValidation = [
  body('type').isIn(['reminder', 'alert', 'tip', 'community', 'expert', 'system']),
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('message').trim().isLength({ min: 1, max: 500 }),
  body('channels').isArray({ min: 1 }),
  body('channels.*').isIn(['email', 'push', 'sms']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('scheduledFor').optional().isISO8601(),
];

export const createAINotificationValidation = [
  body('type').isIn(['reminder', 'alert', 'tip']),
  body('context').isObject(),
  body('channels').isArray({ min: 1 }),
  body('channels.*').isIn(['email', 'push', 'sms']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('scheduledFor').optional().isISO8601(),
];

export const getUserNotificationsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('type').optional().isIn(['reminder', 'alert', 'tip', 'community', 'expert', 'system']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'read']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
];

export const notificationIdValidation = [
  param('notificationId').isMongoId(),
];

export const updatePreferencesValidation = [
  body('emailEnabled').optional().isBoolean(),
  body('pushEnabled').optional().isBoolean(),
  body('smsEnabled').optional().isBoolean(),
  body('emailAddress').optional().isEmail(),
  body('phoneNumber').optional().isMobilePhone('any'),
];

export const pushTokenValidation = [
  body('token').trim().isLength({ min: 1 }),
];