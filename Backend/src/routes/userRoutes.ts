import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { body, query, param } from 'express-validator';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { adminOnly } from '../middleware/roleGuard';
import path from 'path';
import { firebaseService } from '../config/firebase';
import { User } from '../models/User';

const router = express.Router();

// Configure multer for profile picture uploads (store in memory for Firebase upload)
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Rate limiting for user operations
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    error: 'Too many user requests from this IP, please try again later.'
  }
});

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window for admin operations
  message: {
    error: 'Too many admin requests from this IP, please try again later.'
  }
});

// Validation schemas
const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    // Allow letters, numbers, spaces, hyphens, and apostrophes (e.g., "User 01")
    .matches(/^[\p{L}0-9\s'-]+$/u)
    .withMessage('Name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('timezone')
    .optional()
    .matches(/^[A-Za-z_]+\/[A-Za-z_]+$/)
    .withMessage('Please provide a valid timezone (e.g., America/New_York)'),
  
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])
    .withMessage('Please provide a valid language code'),
  
  // Theme preference removed from user profile
];

const updatePreferencesValidation = [
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications preference must be a boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications preference must be a boolean'),
  
  body('notifications.careReminders')
    .optional()
    .isBoolean()
    .withMessage('Care reminders preference must be a boolean'),
  
  body('notifications.communityUpdates')
    .optional()
    .isBoolean()
    .withMessage('Community updates preference must be a boolean'),
  
  body('notifications.systemUpdates')
    .optional()
    .isBoolean()
    .withMessage('System updates preference must be a boolean'),
  
  body('privacy.profileVisibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Profile visibility must be public or private'),
  
  body('privacy.showEmail')
    .optional()
    .isBoolean()
    .withMessage('Show email preference must be a boolean'),
  
  body('privacy.showLocation')
    .optional()
    .isBoolean()
    .withMessage('Show location preference must be a boolean'),
  
  body('privacy.allowSearchEngineIndexing')
    .optional()
    .isBoolean()
    .withMessage('Search engine indexing preference must be a boolean'),
  
  body('plantCare.defaultWateringInterval')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Default watering interval must be between 1 and 365 days'),
  
  body('plantCare.defaultFertilizingInterval')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Default fertilizing interval must be between 1 and 365 days'),
  
  // preferredUnits removed from preferences validation
  
  body('plantCare.reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM format'),
  
  body('plantCare.reminderDays')
    .optional()
    .isArray()
    .withMessage('Reminder days must be an array'),
  
  body('plantCare.reminderDays.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day in reminder days'),
  
  body('dashboard.showQuickStats')
    .optional()
    .isBoolean()
    .withMessage('Show quick stats preference must be a boolean'),
  
  body('dashboard.showRecentActivity')
    .optional()
    .isBoolean()
    .withMessage('Show recent activity preference must be a boolean'),
  
  body('dashboard.showUpcomingReminders')
    .optional()
    .isBoolean()
    .withMessage('Show upcoming reminders preference must be a boolean'),
  
  body('dashboard.showWeatherWidget')
    .optional()
    .isBoolean()
    .withMessage('Show weather widget preference must be a boolean'),
  
  body('dashboard.defaultView')
    .optional()
    .isIn(['grid', 'list'])
    .withMessage('Default view must be grid or list')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

const updateRoleValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('role')
    .isIn(['guest', 'user', 'admin'])
    .withMessage('Role must be guest, user, or admin'),
  
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

const searchUsersValidation = [
  query('q')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  
  query('role')
    .optional()
    .isIn(['guest', 'user', 'admin'])
    .withMessage('Role filter must be guest, user, or admin'),
  
  query('verified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Verified filter must be true or false'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'createdAt', 'lastActiveAt', 'role'])
    .withMessage('Sort by must be name, email, createdAt, lastActiveAt, or role'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

// User profile routes (require authentication)
router.get('/profile', 
  userRateLimit,
  authMiddleware,
  UserController.getProfile
);

router.post('/profile/avatar',
  userRateLimit,
  authMiddleware,
  profilePictureUpload.single('avatar'),
  async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Upload to Firebase Storage
      const bucket = firebaseService.getStorage().bucket();
      const userId = (req.user as any)._id || (req.user as any).uid;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `profile-${userId}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
      const file = bucket.file(`profile-pictures/${filename}`);

      // Upload file buffer to Firebase Storage
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            userId: userId,
            uploadDate: new Date().toISOString()
          }
        },
        validation: 'md5'
      });

      // ✅ Ensure it's publicly readable
      await file.makePublic();

      // Get the public URL
      const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      // Update user's avatar in database
      await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          avatarUrl,
          filename: file.name,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error: any) {
      console.error('Profile picture upload error:', error?.message || error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
      });
    }
  }
);

/**
 * @route   DELETE /api/users/profile/avatar
 * @desc    Delete user's avatar
 * @access  Private
 */
router.delete('/profile/avatar',
  userRateLimit,
  authMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req.user as any)._id || (req.user as any).uid;
      
      // Get user to check if they have an avatar
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // If user has an avatar URL, try to delete from Firebase Storage
      if (user.avatar) {
        try {
          const bucket = firebaseService.getStorage().bucket();
          // Extract filename from URL (e.g., profile-pictures/filename.jpg)
          const urlParts = user.avatar.split('/');
          const filename = urlParts.slice(-2).join('/'); // Get last two parts
          
          const file = bucket.file(filename);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
          }
        } catch (storageError) {
          console.error('Error deleting avatar from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }

      // Remove avatar from user profile
      await User.findByIdAndUpdate(userId, { avatar: null });

      // Get updated user
      const updatedUser = await User.findById(userId).select('-password -refreshTokens');

      res.json({
        success: true,
        message: 'Avatar deleted successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error: any) {
      console.error('Avatar deletion error:', error?.message || error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete avatar',
        error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
      });
    }
  }
);

// Allow multipart/form-data with optional `avatar` file so clients can send an image together with profile fields
router.put('/profile', 
  userRateLimit,
  authMiddleware,
  profilePictureUpload.single('avatar'),
  updateProfileValidation,
  validate,
  UserController.updateProfile
);

router.put('/preferences', 
  userRateLimit,
  authMiddleware,
  updatePreferencesValidation,
  validate,
  UserController.updatePreferences
);

router.put('/change-password', 
  userRateLimit,
  authMiddleware,
  changePasswordValidation,
  validate,
  UserController.changePassword
);

router.delete('/account', 
  userRateLimit,
  authMiddleware,
  UserController.deleteAccount
);

router.get('/stats', 
  userRateLimit,
  authMiddleware,
  UserController.getUserStats
);

// Admin-only routes (require admin role)
router.get('/admin/users', 
  adminRateLimit,
  authMiddleware,
  adminOnly,
  searchUsersValidation,
  validate,
  UserController.getAllUsers
);

router.put('/admin/users/role', 
  adminRateLimit,
  authMiddleware,
  adminOnly,
  updateRoleValidation,
  validate,
  UserController.updateUserRole
);

router.delete('/admin/users/:userId', 
  adminRateLimit,
  authMiddleware,
  adminOnly,
  userIdValidation,
  validate,
  UserController.deleteUser
);

router.get('/admin/users/:userId/analytics', 
  adminRateLimit,
  authMiddleware,
  adminOnly,
  userIdValidation,
  validate,
  UserController.getUserAnalytics
);

// Update notification preferences
router.put('/notification-preferences', 
  userRateLimit,
  authMiddleware,
  UserController.updateNotificationPreferences
);

// Reminder preferences routes
router.get('/reminder-preferences',
  userRateLimit,
  authMiddleware,
  UserController.getReminderPreferences
);

router.put('/reminder-preferences',
  userRateLimit,
  authMiddleware,
  [
    body('enabled')
      .optional()
      .isBoolean()
      .withMessage('Enabled must be a boolean'),
    body('notificationMethods')
      .optional()
      .isArray()
      .withMessage('Notification methods must be an array'),
    body('notificationMethods.*')
      .optional()
      .isIn(['in-app', 'browser', 'email', 'push'])
      .withMessage('Invalid notification method'),
    body('advanceNoticeDays')
      .optional()
      .isInt({ min: 0, max: 30 })
      .withMessage('Advance notice days must be between 0 and 30'),
    body('maxRemindersPerDay')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Max reminders per day must be between 1 and 50'),
    body('quietHours.enabled')
      .optional()
      .isBoolean()
      .withMessage('Quiet hours enabled must be a boolean'),
    body('quietHours.start')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Quiet hours start must be in HH:MM format'),
    body('quietHours.end')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Quiet hours end must be in HH:MM format'),
  ],
  validate,
  UserController.updateReminderPreferences
);

export default router;