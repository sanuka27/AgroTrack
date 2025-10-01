import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { CareLogController } from '../controllers/careLogController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';

const router = express.Router();

// Rate limiting for care log operations
const careLogRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many care log requests from this IP, please try again later.'
  }
});

const bulkOperationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 bulk operations per window
  message: {
    error: 'Too many bulk operations from this IP, please try again later.'
  }
});

// Validation schemas
const createCareLogValidation = [
  body('plantId')
    .notEmpty()
    .withMessage('Plant ID is required')
    .isMongoId()
    .withMessage('Invalid plant ID format'),
  
  body('careType')
    .isIn(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'])
    .withMessage('Care type must be one of: watering, fertilizing, pruning, repotting, health-check, pest-treatment, soil-change, location-change'),
  
  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
    .trim(),
  
  body('photos')
    .optional()
    .isArray()
    .withMessage('Photos must be an array'),
  
  body('photos.*')
    .optional()
    .isURL()
    .withMessage('Each photo must be a valid URL'),
  
  // Care data validation
  body('careData.amount')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Amount must be between 0 and 10000'),
  
  body('careData.waterSource')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Water source cannot exceed 100 characters'),
  
  body('careData.waterQuality')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Water quality cannot exceed 100 characters'),
  
  body('careData.fertilizerType')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Fertilizer type cannot exceed 100 characters'),
  
  body('careData.npkRatio')
    .optional()
    .matches(/^\d+-\d+-\d+$/)
    .withMessage('NPK ratio must be in format N-P-K (e.g., 10-10-10)'),
  
  body('careData.dilution')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Dilution cannot exceed 50 characters'),
  
  body('careData.pruningType')
    .optional()
    .isIn(['deadheading', 'pinching', 'cutting', 'shaping'])
    .withMessage('Pruning type must be deadheading, pinching, cutting, or shaping'),
  
  body('careData.partsRemoved')
    .optional()
    .isArray()
    .withMessage('Parts removed must be an array'),
  
  body('careData.partsRemoved.*')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Each part removed description cannot exceed 100 characters'),
  
  body('careData.newPotSize')
    .optional()
    .isLength({ max: 50 })
    .withMessage('New pot size cannot exceed 50 characters'),
  
  body('careData.soilType')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Soil type cannot exceed 100 characters'),
  
  body('careData.rootCondition')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Root condition cannot exceed 200 characters'),
  
  body('careData.overallHealth')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'critical'])
    .withMessage('Overall health must be excellent, good, fair, poor, or critical'),
  
  body('careData.symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  
  body('careData.symptoms.*')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Each symptom description cannot exceed 100 characters'),
  
  body('careData.pestType')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Pest type cannot exceed 100 characters'),
  
  body('careData.treatmentMethod')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Treatment method cannot exceed 200 characters'),
  
  body('careData.chemicalUsed')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Chemical used cannot exceed 100 characters'),
  
  body('careData.oldSoilCondition')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Old soil condition cannot exceed 200 characters'),
  
  body('careData.newSoilType')
    .optional()
    .isLength({ max: 100 })
    .withMessage('New soil type cannot exceed 100 characters'),
  
  body('careData.previousLocation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Previous location cannot exceed 100 characters'),
  
  body('careData.newLocation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('New location cannot exceed 100 characters'),
  
  body('careData.reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  
  // Environment data validation
  body('environmentData.temperature')
    .optional()
    .isFloat({ min: -50, max: 60 })
    .withMessage('Temperature must be between -50°C and 60°C'),
  
  body('environmentData.humidity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Humidity must be between 0% and 100%'),
  
  body('environmentData.lightLevel')
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage('Light level must be between 0 and 100000 lux'),
  
  body('environmentData.airQuality')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Air quality cannot exceed 50 characters'),
  
  body('scheduledCare')
    .optional()
    .isBoolean()
    .withMessage('Scheduled care must be a boolean'),
  
  body('reminderCompleted')
    .optional()
    .isMongoId()
    .withMessage('Reminder completed must be a valid reminder ID')
];

const updateCareLogValidation = [
  // All fields are optional for updates, but use same validation rules
  ...createCareLogValidation.map(validation => {
    // Make all validations optional for updates
    if (validation.toString().includes('notEmpty')) {
      return validation.optional();
    }
    return validation;
  }).filter(validation => !validation.toString().includes('plantId')) // Remove plantId validation for updates
];

const searchCareLogsValidation = [
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  query('careType')
    .optional()
    .isIn(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'])
    .withMessage('Care type must be one of: watering, fertilizing, pruning, repotting, health-check, pest-treatment, soil-change, location-change'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  query('scheduledCare')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Scheduled care filter must be true or false'),
  
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
    .isIn(['createdAt', 'careType', 'plantName', 'updatedAt'])
    .withMessage('Sort by must be createdAt, careType, plantName, or updatedAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const careLogIdValidation = [
  param('careLogId')
    .isMongoId()
    .withMessage('Invalid care log ID format')
];

const bulkOperationValidation = [
  body('careLogIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Care log IDs must be an array with 1-50 items'),
  
  body('careLogIds.*')
    .isMongoId()
    .withMessage('Each care log ID must be a valid MongoDB ObjectId'),
  
  body('operation')
    .isIn(['delete', 'updateNotes'])
    .withMessage('Operation must be delete or updateNotes'),
  
  body('data.notes')
    .if(body('operation').equals('updateNotes'))
    .notEmpty()
    .withMessage('Notes are required for updateNotes operation')
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

const statsValidation = [
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days')
];

const recommendationsValidation = [
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId')
];

// Care log CRUD routes
router.post('/', 
  careLogRateLimit,
  authMiddleware,
  createCareLogValidation,
  validate,
  CareLogController.createCareLog
);

router.get('/', 
  careLogRateLimit,
  authMiddleware,
  searchCareLogsValidation,
  validate,
  CareLogController.getCareLogs
);

router.get('/stats', 
  careLogRateLimit,
  authMiddleware,
  statsValidation,
  validate,
  CareLogController.getCareLogStats
);

router.get('/recommendations', 
  careLogRateLimit,
  authMiddleware,
  recommendationsValidation,
  validate,
  CareLogController.getCareRecommendations
);

router.get('/:careLogId', 
  careLogRateLimit,
  authMiddleware,
  careLogIdValidation,
  validate,
  CareLogController.getCareLogById
);

router.put('/:careLogId', 
  careLogRateLimit,
  authMiddleware,
  careLogIdValidation,
  updateCareLogValidation,
  validate,
  CareLogController.updateCareLog
);

router.delete('/:careLogId', 
  careLogRateLimit,
  authMiddleware,
  careLogIdValidation,
  validate,
  CareLogController.deleteCareLog
);

// Bulk operations
router.post('/bulk', 
  bulkOperationRateLimit,
  authMiddleware,
  bulkOperationValidation,
  validate,
  CareLogController.bulkOperation
);

export default router;