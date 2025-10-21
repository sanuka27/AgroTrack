import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { body, query, param } from 'express-validator';
import { DiseaseDetectionController } from '../controllers/diseaseDetectionController';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import path from 'path';
import { firebaseService } from '../config/firebase';

const router = express.Router();

// Rate limiting for disease detection operations
const diseaseDetectionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 detections per window (AI processing is resource intensive)
  message: {
    error: 'Too many disease detection requests from this IP, please try again later.'
  }
});

const knowledgeBaseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many knowledge base requests from this IP, please try again later.'
  }
});

const feedbackRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 feedback submissions per hour
  message: {
    error: 'Too many feedback submissions from this IP, please try again later.'
  }
});

// Configure multer for image uploads (store in memory for Firebase upload)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
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

// Validation schemas
const detectDiseaseValidation = [
  body('imageUrl')
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    .withMessage('Image URL must point to a valid image file (jpg, jpeg, png, gif, bmp, webp)'),
  
  body('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  body('plantName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 120 })
    .withMessage('Plant name must be a string up to 120 chars')
    .trim(),
  
  body('imageStoragePath')
    .optional()
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Image storage path must be a string up to 255 chars')
    .trim(),
  
  body('description')
    .optional()
    .isString()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Description must be 3-1000 characters')
    .trim(),
  
  body('selectedSymptoms')
    .optional()
    .isArray({ max: 20 })
    .withMessage('selectedSymptoms must be an array')
    .custom((arr) => Array.isArray(arr) && arr.every((s: any) => typeof s === 'string' && s.length > 0 && s.length <= 120))
    .withMessage('Each symptom must be a non-empty string up to 120 characters'),
  
  body('originalFileName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Original filename must be between 1 and 255 characters')
    .trim()
];

const detectionHistoryValidation = [
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  query('diseaseDetected')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('diseaseDetected filter must be true or false'),
  
  query('status')
    .optional()
    .isIn(['processing', 'completed', 'failed', 'expert-review'])
    .withMessage('Status must be processing, completed, failed, or expert-review'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date')
    .custom((value, { req }) => {
      if (value && req.query?.dateFrom) {
        const fromDate = new Date(req.query.dateFrom as string);
        const toDate = new Date(value);
        if (toDate <= fromDate) {
          throw new Error('Date to must be after date from');
        }
      }
      return true;
    }),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'confidence', 'severity'])
    .withMessage('Sort by must be createdAt, confidence, or severity'),
  
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

const detectionIdValidation = [
  param('detectionId')
    .isMongoId()
    .withMessage('Invalid detection ID format')
];

const submitFeedbackValidation = [
  body('helpful')
    .notEmpty()
    .withMessage('Helpful field is required')
    .isBoolean()
    .withMessage('Helpful must be a boolean'),
  body('accuracyRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Accuracy rating must be between 1 and 5'),
  body('treatmentEffective')
    .optional()
    .isBoolean()
    .withMessage('Treatment effective must be a boolean'),
  body('additionalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Additional notes cannot exceed 1000 characters')
    .trim()
];

const diseaseKnowledgeValidation = [
  query('category')
    .optional()
    .isIn(['fungal', 'bacterial', 'viral', 'pest', 'nutritional', 'environmental'])
    .withMessage('Category must be fungal, bacterial, viral, pest, nutritional, or environmental'),
  
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),
  
  query('affectedPlant')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Affected plant must be between 2 and 50 characters')
    .trim(),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'category', 'createdAt'])
    .withMessage('Sort by must be name, category, or createdAt'),
  
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

const diseaseIdValidation = [
  param('diseaseId')
    .isMongoId()
    .withMessage('Invalid disease ID format')
];

const detectionStatsValidation = [
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Timeframe must be 7d, 30d, 90d, 1y, or all')
];

// Disease Detection routes

/**
 * @route   POST /api/disease-detection/upload
 * @desc    Upload an image for disease detection
 * @access  Public (with optional auth for guests)
 */
router.post('/upload',
  diseaseDetectionRateLimit,
  optionalAuth,
  imageUpload.single('image'),
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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = 'ai-' + uniqueSuffix + path.extname(req.file.originalname);
      const file = bucket.file(`disease-detection/${filename}`);

      // Upload file buffer to Firebase Storage
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: (req.user as any)?._id || (req.user as any)?.uid || 'guest',
            uploadDate: new Date().toISOString()
          }
        },
        validation: 'md5'
      });

      // ✅ Ensure it's publicly readable
      await file.makePublic();

      // Get the public URL
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl,
          filename: file.name,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error: any) {
      console.error('Image upload error:', error?.message || error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
      });
    }
  }
);

router.post('/detect', 
  diseaseDetectionRateLimit,
  optionalAuth,
  detectDiseaseValidation,
  validate,
  DiseaseDetectionController.detectDisease
);

router.get('/history', 
  knowledgeBaseRateLimit,
  authMiddleware,
  detectionHistoryValidation,
  validate,
  DiseaseDetectionController.getDetectionHistory
);

router.get('/stats', 
  knowledgeBaseRateLimit,
  authMiddleware,
  detectionStatsValidation,
  validate,
  DiseaseDetectionController.getDetectionStats
);

router.get('/:detectionId', 
  knowledgeBaseRateLimit,
  authMiddleware,
  detectionIdValidation,
  validate,
  DiseaseDetectionController.getDetectionById
);

router.post('/:detectionId/feedback', 
  feedbackRateLimit,
  authMiddleware,
  detectionIdValidation,
  submitFeedbackValidation,
  validate,
  DiseaseDetectionController.submitFeedback
);

// Disease Knowledge Base routes
router.get('/knowledge/diseases', 
  knowledgeBaseRateLimit,
  diseaseKnowledgeValidation,
  validate,
  DiseaseDetectionController.getDiseaseKnowledge
);

router.get('/knowledge/diseases/:diseaseId', 
  knowledgeBaseRateLimit,
  diseaseIdValidation,
  validate,
  DiseaseDetectionController.getDiseaseById
);

export default router;