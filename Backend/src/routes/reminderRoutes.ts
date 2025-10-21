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
  body('title').notEmpty().isLength({ min: 1, max: 120 }).trim(),
  body('dueAt').notEmpty().isISO8601(),
  body('notes').optional().isLength({ max: 1000 }).trim(),
  body('plantId').optional().isMongoId(),
];

const updateReminderValidation = [
  body('title').optional().isLength({ min: 1, max: 120 }).trim(),
  body('dueAt').optional().isISO8601(),
  body('notes').optional().isLength({ max: 1000 }).trim(),
  body('plantId').optional().isMongoId(),
];

const searchRemindersValidation = [
  query('plantId').optional().isMongoId(),
  query('status').optional().isIn(['pending', 'completed']),
  query('upcoming').optional().isIn(['true', 'false']),
  query('overdue').optional().isIn(['true', 'false']),
];

const reminderIdValidation = [
  param('reminderId')
    .isMongoId()
    .withMessage('Invalid reminder ID format')
];

const completeReminderValidation = [
  body('notes').optional().isLength({ max: 1000 }).trim(),
];

const snoozeReminderValidation = [
  body('hours').optional().isInt({ min: 1, max: 168 }),
];

const upcomingRemindersValidation = [
  query('days').optional().isInt({ min: 1, max: 30 }),
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