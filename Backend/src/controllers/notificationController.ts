import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { NotificationPreference } from '../models/NotificationPreference';
import { Notification } from '../models/Notification';
import { logger } from '../config/logger';

// Interfaces for request types
interface AuthenticatedRequest extends Request {
  user?: any;
}

type NotificationData = object;

// Mock notification service functions (would be replaced with actual services)
class NotificationService {}

// Create notification
export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
    const { type, title, message, data } = req.body as any;
    const notif = await Notification.create({ userId, type, title, message, data });
    return res.status(201).json({ success: true, data: { notification: notif } });
  } catch (error) {
    logger.error('Error creating notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};

// Helper to create notifications programmatically
export async function createNotificationNow(payload: { userId: mongoose.Types.ObjectId; type: string; title: string; message: string; data?: any }) {
  try {
    const n = await Notification.create({ userId: payload.userId, type: payload.type as any, title: payload.title, message: payload.message, data: payload.data });
    return n;
  } catch (err) {
    logger.error('Failed to persist notification:', err);
    return null;
  }
}

// Create AI-generated notification
export const createAINotification = async (_req: AuthenticatedRequest, res: Response) => {
  return res.status(501).json({ success: false, message: 'Notifications are not available in this deployment.' });
};

// Get user notifications
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
    const page = Number((req.query.page as string) || 1);
    const limit = Math.min(Number((req.query.limit as string) || 20), 50);
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status === 'read') filter.isRead = true;
    if (req.query.status === 'unread') filter.isRead = false;

    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { notifications: items, total } });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};


// Get notification preferences
export const getNotificationPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
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
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
    return;
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

    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
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
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
    return;
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
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

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
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
    return;
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
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

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
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
    return;
  }
};

// Send scheduled notifications (to be called by a cron job)
export const processScheduledNotifications = async () => { logger.info('Notifications are disabled. Skipping scheduler.'); };

// Helper function to send notification immediately
async function sendNotificationNow(_notification: any): Promise<void> { /* no-op */ }

// Mark a single notification as read
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
    const { notificationId } = req.params as any;
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, data: { notification: updated } });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read for the user
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
  const result: any = await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  const modified = result?.modifiedCount ?? result?.nModified ?? 0;
  return res.json({ success: true, data: { modifiedCount: modified } });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
    const { notificationId } = req.params as any;
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

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
