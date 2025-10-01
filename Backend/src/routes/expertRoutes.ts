import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { ExpertController } from '../controllers/expertController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';

const router = express.Router();

// Rate limiting for expert consultation operations
const expertRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    error: 'Too many expert consultation requests from this IP, please try again later.'
  }
});

const bookingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 bookings per hour
  message: {
    error: 'Too many consultation bookings from this IP, please try again later.'
  }
});

const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 messages per window
  message: {
    error: 'Too many chat messages from this IP, please try again later.'
  }
});

const reviewRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 reviews per day
  message: {
    error: 'Too many reviews from this IP, please try again later.'
  }
});

// Validation schemas
const createExpertProfileValidation = [
  body('specializations')
    .isArray({ min: 1, max: 10 })
    .withMessage('Specializations must be an array with 1-10 items'),
  
  body('specializations.*')
    .isIn([
      'houseplants', 'succulents', 'orchids', 'herbs', 'vegetables', 
      'flowers', 'trees', 'pest-control', 'plant-diseases', 
      'hydroponics', 'organic-gardening', 'landscaping'
    ])
    .withMessage('Each specialization must be a valid plant category'),
  
  body('yearsOfExperience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  
  body('qualifications')
    .isArray({ max: 20 })
    .withMessage('Qualifications must be an array with maximum 20 items'),
  
  body('qualifications.*')
    .isLength({ min: 2, max: 200 })
    .withMessage('Each qualification must be between 2 and 200 characters')
    .trim(),
  
  body('bio')
    .notEmpty()
    .withMessage('Bio is required')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Bio must be between 50 and 2000 characters')
    .trim(),
  
  body('hourlyRate')
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Hourly rate must be between 0 and 1000'),
  
  body('availability.timezone')
    .notEmpty()
    .withMessage('Timezone is required')
    .matches(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .withMessage('Timezone must be in format: Continent/City'),
  
  body('availability.schedule')
    .isObject()
    .withMessage('Schedule must be an object'),
  
  body('languages')
    .isArray({ min: 1, max: 10 })
    .withMessage('Languages must be an array with 1-10 items'),
  
  body('languages.*')
    .isLength({ min: 2, max: 50 })
    .withMessage('Each language must be between 2 and 50 characters')
    .trim(),
  
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL')
];

const searchExpertsValidation = [
  query('specialization')
    .optional()
    .custom((value) => {
      const validSpecializations = [
        'houseplants', 'succulents', 'orchids', 'herbs', 'vegetables', 
        'flowers', 'trees', 'pest-control', 'plant-diseases', 
        'hydroponics', 'organic-gardening', 'landscaping'
      ];
      
      if (typeof value === 'string') {
        return validSpecializations.includes(value);
      }
      
      if (Array.isArray(value)) {
        return value.every(spec => validSpecializations.includes(spec));
      }
      
      throw new Error('Specialization must be a valid specialization or array of specializations');
    }),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  
  query('maxHourlyRate')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Maximum hourly rate must be between 0 and 1000'),
  
  query('languages')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value) && value.length <= 10) return true;
      throw new Error('Languages must be a string or array with maximum 10 items');
    }),
  
  query('verificationStatus')
    .optional()
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('Verification status must be pending, verified, or rejected'),
  
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),
  
  query('sortBy')
    .optional()
    .isIn(['rating', 'hourlyRate', 'experience', 'reviews', 'createdAt'])
    .withMessage('Sort by must be rating, hourlyRate, experience, reviews, or createdAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const expertIdValidation = [
  param('expertId')
    .isMongoId()
    .withMessage('Invalid expert ID format')
];

const bookConsultationValidation = [
  body('expertId')
    .notEmpty()
    .withMessage('Expert ID is required')
    .isMongoId()
    .withMessage('Expert ID must be a valid MongoDB ObjectId'),
  
  body('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  body('type')
    .isIn(['instant', 'scheduled', 'follow-up'])
    .withMessage('Type must be instant, scheduled, or follow-up'),
  
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  
  body('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Topic must be between 5 and 200 characters')
    .trim(),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters')
    .trim(),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  body('consultationMethod')
    .optional()
    .isIn(['chat', 'video', 'phone'])
    .withMessage('Consultation method must be chat, video, or phone')
];

const consultationIdValidation = [
  param('consultationId')
    .isMongoId()
    .withMessage('Invalid consultation ID format')
];

const searchConsultationsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, confirmed, in-progress, completed, or cancelled'),
  
  query('type')
    .optional()
    .isIn(['instant', 'scheduled', 'follow-up'])
    .withMessage('Type must be instant, scheduled, or follow-up'),
  
  query('clientId')
    .optional()
    .isMongoId()
    .withMessage('Client ID must be a valid MongoDB ObjectId'),
  
  query('expertId')
    .optional()
    .isMongoId()
    .withMessage('Expert ID must be a valid MongoDB ObjectId'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  query('sortBy')
    .optional()
    .isIn(['scheduledDate', 'createdAt', 'status', 'totalCost'])
    .withMessage('Sort by must be scheduledDate, createdAt, status, or totalCost'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const updateConsultationStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, confirmed, in-progress, completed, or cancelled'),
  
  body('expertNotes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Expert notes cannot exceed 2000 characters')
    .trim(),
  
  body('summary')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Summary cannot exceed 1000 characters')
    .trim(),
  
  body('recommendations')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Recommendations must be an array with maximum 20 items'),
  
  body('recommendations.*')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Each recommendation must be between 5 and 500 characters')
    .trim()
];

const sendMessageValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim(),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Message type must be text, image, or file'),
  
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Attachments must be an array with maximum 5 items'),
  
  body('attachments.*')
    .optional()
    .isURL()
    .withMessage('Each attachment must be a valid URL')
];

const getChatMessagesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const submitReviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .notEmpty()
    .withMessage('Review is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Review must be between 10 and 2000 characters')
    .trim(),
  
  body('aspects.expertise')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Expertise aspect rating must be between 1 and 5'),
  
  body('aspects.communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication aspect rating must be between 1 and 5'),
  
  body('aspects.timeliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Timeliness aspect rating must be between 1 and 5'),
  
  body('aspects.helpfulness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Helpfulness aspect rating must be between 1 and 5')
];

const getReviewsValidation = [
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  
  query('sortBy')
    .optional()
    .isIn(['rating', 'createdAt'])
    .withMessage('Sort by must be rating or createdAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Expert Profile routes
router.post('/profile', 
  expertRateLimit,
  authMiddleware,
  createExpertProfileValidation,
  validate,
  ExpertController.createExpertProfile
);

router.get('/search', 
  expertRateLimit,
  searchExpertsValidation,
  validate,
  ExpertController.getExperts
);

router.get('/profile/:expertId', 
  expertRateLimit,
  expertIdValidation,
  validate,
  ExpertController.getExpertProfile
);

router.get('/dashboard', 
  expertRateLimit,
  authMiddleware,
  ExpertController.getExpertDashboard
);

// Consultation booking routes
router.post('/consultations', 
  bookingRateLimit,
  authMiddleware,
  bookConsultationValidation,
  validate,
  ExpertController.bookConsultation
);

router.get('/consultations', 
  expertRateLimit,
  authMiddleware,
  searchConsultationsValidation,
  validate,
  ExpertController.getConsultations
);

router.put('/consultations/:consultationId/status', 
  expertRateLimit,
  authMiddleware,
  consultationIdValidation,
  updateConsultationStatusValidation,
  validate,
  ExpertController.updateConsultationStatus
);

// Chat routes
router.post('/consultations/:consultationId/messages', 
  chatRateLimit,
  authMiddleware,
  consultationIdValidation,
  sendMessageValidation,
  validate,
  ExpertController.sendMessage
);

router.get('/consultations/:consultationId/messages', 
  expertRateLimit,
  authMiddleware,
  consultationIdValidation,
  getChatMessagesValidation,
  validate,
  ExpertController.getChatMessages
);

// Review routes
router.post('/consultations/:consultationId/review', 
  reviewRateLimit,
  authMiddleware,
  consultationIdValidation,
  submitReviewValidation,
  validate,
  ExpertController.submitReview
);

router.get('/profile/:expertId/reviews', 
  expertRateLimit,
  expertIdValidation,
  getReviewsValidation,
  validate,
  ExpertController.getExpertReviews
);

export default router;