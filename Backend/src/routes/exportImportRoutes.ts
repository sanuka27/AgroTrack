import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { body, query } from 'express-validator';
import exportImportController from '../controllers/exportImportController';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept JSON and CSV files
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, and ZIP files are allowed'));
    }
  }
});

// Rate limiting for export/import operations
const exportImportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many export/import requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const exportValidation = [
  body('format')
    .optional()
    .isIn(['json', 'csv', 'both'])
    .withMessage('Format must be json, csv, or both'),
  
  body('dataTypes')
    .isArray({ min: 1 })
    .withMessage('At least one data type must be selected')
    .custom((dataTypes: string[]) => {
      const validTypes = ['profile', 'preferences', 'plants', 'careLogs', 'reminders', 'posts', 'notifications'];
      const invalidTypes = dataTypes.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid data types: ${invalidTypes.join(', ')}`);
      }
      return true;
    }),
  
  body('dateRange')
    .optional()
    .isObject()
    .withMessage('Date range must be an object'),
  
  body('dateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  body('dateRange.end')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((endDate, { req }) => {
      if (req.body.dateRange?.start && new Date(endDate) <= new Date(req.body.dateRange.start)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('includeMedia')
    .optional()
    .isBoolean()
    .withMessage('Include media must be a boolean')
];

const importValidation = [
  body('overwrite')
    .optional()
    .isBoolean()
    .withMessage('Overwrite must be a boolean'),
  
  body('validateOnly')
    .optional()
    .isBoolean()
    .withMessage('Validate only must be a boolean'),
  
  body('dataTypes')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Data types must be an array');
          }
          return true;
        } catch {
          throw new Error('Data types must be valid JSON array');
        }
      }
      return true;
    })
];

const cleanupValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Routes

/**
 * @route   POST /api/export-import/export
 * @desc    Export user data in specified format
 * @access  Private
 */
router.post('/export', 
  exportImportLimiter,
  protect, 
  exportValidation,
  validate,
  exportImportController.exportUserData
);

/**
 * @route   POST /api/export-import/import
 * @desc    Import user data from file
 * @access  Private
 */
router.post('/import',
  exportImportLimiter,
  protect,
  upload.single('importFile'),
  importValidation,
  validate,
  exportImportController.importUserData
);

/**
 * @route   GET /api/export-import/download/:exportId
 * @desc    Download exported data file
 * @access  Private
 */
router.get('/download/:exportId',
  protect,
  exportImportController.downloadExport
);

/**
 * @route   GET /api/export-import/history
 * @desc    Get user's export/import history
 * @access  Private
 */
router.get('/history',
  protect,
  exportImportController.getExportHistory
);

/**
 * @route   GET /api/export-import/operation/:operationId
 * @desc    Get detailed operation information
 * @access  Private
 */
router.get('/operation/:operationId',
  protect,
  exportImportController.getOperationDetails
);

/**
 * @route   DELETE /api/export-import/cleanup
 * @desc    Clean up old export files (admin only)
 * @access  Private (Admin)
 */
router.delete('/cleanup',
  protect,
  // roleGuard(['admin']), // Uncomment when admin roles are implemented
  cleanupValidation,
  validate,
  exportImportController.cleanupExports
);

export default router;