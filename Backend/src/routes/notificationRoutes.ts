import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect as authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createNotification,
  createAINotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  addPushToken,
  removePushToken,
  createNotificationValidation,
  createAINotificationValidation,
  getUserNotificationsValidation,
  notificationIdValidation,
  updatePreferencesValidation,
  pushTokenValidation
} from '../controllers/notificationController';

const router = express.Router();

// Rate limiting for notification operations
const notificationCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each user to 50 notification requests per windowMs
  message: {
    success: false,
    message: 'Too many notification requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const notificationReadLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for reading notifications
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiNotificationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit AI notifications per hour
  message: {
    success: false,
    message: 'Too many AI notification requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(authMiddleware);

// Notification CRUD routes
router.post(
  '/',
  notificationCreateLimit,
  createNotificationValidation,
  validate,
  createNotification
);

router.post(
  '/ai-generate',
  aiNotificationLimit,
  createAINotificationValidation,
  validate,
  createAINotification
);

router.get(
  '/',
  notificationReadLimit,
  getUserNotificationsValidation,
  validate,
  getUserNotifications
);

router.patch(
  '/:notificationId/read',
  notificationReadLimit,
  notificationIdValidation,
  validate,
  markNotificationAsRead
);

router.patch(
  '/mark-all-read',
  notificationReadLimit,
  markAllNotificationsAsRead
);

router.delete(
  '/:notificationId',
  notificationReadLimit,
  notificationIdValidation,
  validate,
  deleteNotification
);

// Notification preferences routes
router.get(
  '/preferences',
  notificationReadLimit,
  getNotificationPreferences
);

router.put(
  '/preferences',
  notificationCreateLimit,
  updatePreferencesValidation,
  validate,
  updateNotificationPreferences
);

// Push token management routes
router.post(
  '/push-token',
  notificationCreateLimit,
  pushTokenValidation,
  validate,
  addPushToken
);

router.delete(
  '/push-token',
  notificationCreateLimit,
  pushTokenValidation,
  validate,
  removePushToken
);

export default router;