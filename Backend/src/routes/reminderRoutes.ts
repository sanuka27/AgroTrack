import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { ReminderController } from '../controllers/reminderController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';

const router = express.Router();

// Rate limiting for reminder operations
const reminderRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many reminder requests from this IP, please try again later.'
  }
});

const bulkOperationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 bulk operations per window
  message: {
    error: 'Too many bulk operations from this IP, please try again later.'
  }
});

const smartScheduleRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 smart schedule requests per window (more resource intensive)
  message: {
    error: 'Too many smart schedule requests from this IP, please try again later.'
  }
});

// Validation schemas
const createReminderValidation = [
  body('plantId')
    .notEmpty()
    .withMessage('Plant ID is required')
    .isMongoId()
    .withMessage('Invalid plant ID format'),
  
  body('careType')
    .isIn(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'])
    .withMessage('Care type must be one of: watering, fertilizing, pruning, repotting, health-check, pest-treatment, soil-change, location-change'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate < now) {
        throw new Error('Scheduled date cannot be in the past');
      }
      return true;
    }),
  
  body('priority')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  
  body('recurringPattern.frequency')
    .if((value, { req }) => req.body?.isRecurring === true)
    .notEmpty()
    .withMessage('Frequency is required for recurring reminders')
    .isInt({ min: 1, max: 365 })
    .withMessage('Frequency must be between 1 and 365 days'),
  
  body('recurringPattern.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value) {
        const endDate = new Date(value);
        const scheduledDate = new Date(req.body.scheduledDate);
        if (endDate <= scheduledDate) {
          throw new Error('End date must be after scheduled date');
        }
      }
      return true;
    }),
  
  body('recurringPattern.maxOccurrences')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max occurrences must be between 1 and 100'),
  
  body('customInstructions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Custom instructions cannot exceed 2000 characters')
    .trim(),
  
  body('weatherDependent')
    .optional()
    .isBoolean()
    .withMessage('weatherDependent must be a boolean'),
  
  body('seasonalAdjustment')
    .optional()
    .isBoolean()
    .withMessage('seasonalAdjustment must be a boolean'),
  
  body('notificationSettings.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification setting must be a boolean'),
  
  body('notificationSettings.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification setting must be a boolean'),
  
  body('notificationSettings.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification setting must be a boolean'),
  
  body('notificationSettings.advanceNotice')
    .optional()
    .isInt({ min: 0, max: 168 })
    .withMessage('Advance notice must be between 0 and 168 hours (1 week)')
];

const updateReminderValidation = [
  // All fields are optional for updates, but use same validation rules
  body('plantId')
    .optional()
    .isMongoId()
    .withMessage('Invalid plant ID format'),
  
  body('careType')
    .optional()
    .isIn(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'])
    .withMessage('Care type must be one of: watering, fertilizing, pruning, repotting, health-check, pest-treatment, soil-change, location-change'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  
  body('recurringPattern.frequency')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Frequency must be between 1 and 365 days'),
  
  body('recurringPattern.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('recurringPattern.maxOccurrences')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max occurrences must be between 1 and 100'),
  
  body('customInstructions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Custom instructions cannot exceed 2000 characters')
    .trim(),
  
  body('weatherDependent')
    .optional()
    .isBoolean()
    .withMessage('weatherDependent must be a boolean'),
  
  body('seasonalAdjustment')
    .optional()
    .isBoolean()
    .withMessage('seasonalAdjustment must be a boolean'),
  
  body('notificationSettings.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification setting must be a boolean'),
  
  body('notificationSettings.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification setting must be a boolean'),
  
  body('notificationSettings.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification setting must be a boolean'),
  
  body('notificationSettings.advanceNotice')
    .optional()
    .isInt({ min: 0, max: 168 })
    .withMessage('Advance notice must be between 0 and 168 hours (1 week)')
];

const searchRemindersValidation = [
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  query('careType')
    .optional()
    .isIn(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'])
    .withMessage('Care type must be one of: watering, fertilizing, pruning, repotting, health-check, pest-treatment, soil-change, location-change'),
  
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'snoozed', 'cancelled'])
    .withMessage('Status must be pending, completed, snoozed, or cancelled'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  query('isRecurring')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRecurring filter must be true or false'),
  
  query('weatherDependent')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('weatherDependent filter must be true or false'),
  
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
    .isIn(['scheduledDate', 'createdAt', 'priority', 'careType', 'title', 'status'])
    .withMessage('Sort by must be scheduledDate, createdAt, priority, careType, title, or status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const reminderIdValidation = [
  param('reminderId')
    .isMongoId()
    .withMessage('Invalid reminder ID format')
];

const completeReminderValidation = [
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),
  
  body('createCareLog')
    .optional()
    .isBoolean()
    .withMessage('createCareLog must be a boolean')
];

const snoozeReminderValidation = [
  body('hours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Hours must be between 1 and 168 (1 week)'),
  
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
    .trim()
];

const upcomingRemindersValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30')
];

const smartScheduleValidation = [
  body('plantId')
    .notEmpty()
    .withMessage('Plant ID is required')
    .isMongoId()
    .withMessage('Invalid plant ID format'),
  
  body('careTypes')
    .isArray({ min: 1 })
    .withMessage('Care types must be a non-empty array'),
  
  body('careTypes.*')
    .isIn(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'])
    .withMessage('Each care type must be one of: watering, fertilizing, pruning, repotting, health-check, pest-treatment, soil-change, location-change'),
  
  body('analysisDepth')
    .optional()
    .isIn(['basic', 'advanced', 'ai-powered'])
    .withMessage('Analysis depth must be basic, advanced, or ai-powered'),
  
  body('considerWeather')
    .optional()
    .isBoolean()
    .withMessage('considerWeather must be a boolean'),
  
  body('considerSeason')
    .optional()
    .isBoolean()
    .withMessage('considerSeason must be a boolean'),
  
  body('optimizeForUser')
    .optional()
    .isBoolean()
    .withMessage('optimizeForUser must be a boolean')
];

const bulkOperationValidation = [
  body('reminderIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Reminder IDs must be an array with 1-50 items'),
  
  body('reminderIds.*')
    .isMongoId()
    .withMessage('Each reminder ID must be a valid MongoDB ObjectId'),
  
  body('operation')
    .isIn(['delete', 'complete', 'snooze', 'updatePriority'])
    .withMessage('Operation must be delete, complete, snooze, or updatePriority'),
  
  body('data.priority')
    .if(body('operation').equals('updatePriority'))
    .notEmpty()
    .withMessage('Priority is required for updatePriority operation')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  
  body('data.snoozeHours')
    .if(body('operation').equals('snooze'))
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Snooze hours must be between 1 and 168 hours'),
  
  body('data.completionNotes')
    .if(body('operation').equals('complete'))
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Completion notes cannot exceed 1000 characters')
];

// Reminder CRUD routes
router.post('/', 
  reminderRateLimit,
  authMiddleware,
  createReminderValidation,
  validate,
  ReminderController.createReminder
);

router.get('/', 
  reminderRateLimit,
  authMiddleware,
  searchRemindersValidation,
  validate,
  ReminderController.getReminders
);

router.get('/upcoming', 
  reminderRateLimit,
  authMiddleware,
  upcomingRemindersValidation,
  validate,
  ReminderController.getUpcomingReminders
);

router.get('/:reminderId', 
  reminderRateLimit,
  authMiddleware,
  reminderIdValidation,
  validate,
  ReminderController.getReminderById
);

router.put('/:reminderId', 
  reminderRateLimit,
  authMiddleware,
  reminderIdValidation,
  updateReminderValidation,
  validate,
  ReminderController.updateReminder
);

router.delete('/:reminderId', 
  reminderRateLimit,
  authMiddleware,
  reminderIdValidation,
  validate,
  ReminderController.deleteReminder
);

// Reminder actions
router.post('/:reminderId/complete', 
  reminderRateLimit,
  authMiddleware,
  reminderIdValidation,
  completeReminderValidation,
  validate,
  ReminderController.completeReminder
);

router.post('/:reminderId/snooze', 
  reminderRateLimit,
  authMiddleware,
  reminderIdValidation,
  snoozeReminderValidation,
  validate,
  ReminderController.snoozeReminder
);

// Smart scheduling
router.post('/smart-schedule', 
  smartScheduleRateLimit,
  authMiddleware,
  smartScheduleValidation,
  validate,
  ReminderController.generateSmartSchedule
);

// Bulk operations
router.post('/bulk', 
  bulkOperationRateLimit,
  authMiddleware,
  bulkOperationValidation,
  validate,
  ReminderController.bulkOperation
);

export default router;