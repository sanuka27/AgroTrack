import express from 'express';
import { validateRequest, validateCustom } from '../middleware/validation';
import { 
  authSchemas, 
  userSchemas, 
  plantSchemas, 
  careLogSchemas, 
  reminderSchemas, 
  searchSchemas 
} from '../schemas/validationSchemas';
import { createValidationMiddleware } from '../middleware/advancedValidation';

const router = express.Router();

/**
 * Example integration of validation middleware with existing routes
 * This file demonstrates how to integrate the validation system with your existing controllers
 */

// Authentication routes with validation
router.post('/auth/register', 
  validateRequest(authSchemas.register, { source: 'body' }),
  // Your existing authController.register
);

router.post('/auth/login',
  validateRequest(authSchemas.login, { source: 'body' }),
  // Your existing authController.login
);

router.post('/auth/forgot-password',
  validateRequest(authSchemas.forgotPassword, { source: 'body' }),
  // Your existing authController.forgotPassword
);

router.post('/auth/reset-password',
  validateRequest(authSchemas.resetPassword, { source: 'body' }),
  // Your existing authController.resetPassword
);

// Plant routes with validation
router.post('/plants',
  // validateRequest('body', validationSchemas.plant.create), // Example validation
  // Your existing plantController.create
);

router.put('/plants/:id',
  validateRequest(plantSchemas.update, { source: 'body' }),
  // Your existing plantController.update
);

router.get('/plants/search',
  validateRequest(plantSchemas.search, { source: 'query' }),
  // Your existing plantController.search
);

// Care log routes with validation
router.post('/care-logs',
  validateRequest(careLogSchemas.create, { source: 'body' }),
  // Your existing careLogController.create
);

router.put('/care-logs/:id',
  validateRequest(careLogSchemas.update, { source: 'body' }),
  // Your existing careLogController.update
);

router.get('/care-logs/search',
  validateRequest(careLogSchemas.search, { source: 'query' }),
  // Your existing careLogController.search
);

// Reminder routes with validation
router.post('/reminders',
  validateRequest(reminderSchemas.create, { source: 'body' }),
  // Your existing reminderController.create
);

router.put('/reminders/:id',
  validateRequest(reminderSchemas.update, { source: 'body' }),
  // Your existing reminderController.update
);

router.get('/reminders/search',
  validateRequest(reminderSchemas.search, { source: 'query' }),
  // Your existing reminderController.search
);

// User routes with validation
router.put('/users/profile',
  validateRequest(userSchemas.updateProfile, { source: 'body' }),
  // Your existing userController.updateProfile
);

router.put('/users/preferences',
  validateRequest(userSchemas.updatePreferences, { source: 'body' }),
  // Your existing userController.updatePreferences
);

// Search routes with validation
router.get('/search',
  validateRequest(searchSchemas.universal, { source: 'query' }),
  // Your existing searchController.universalSearch
);

router.get('/search/suggestions',
  validateRequest(searchSchemas.suggestions, { source: 'query' }),
  // Your existing searchController.getSuggestions
);

// Advanced validation example - custom business logic validation
router.post('/plants/bulk-import',
  validateRequest(plantSchemas.create, { source: 'body' }), // Basic validation first
  // Add custom middleware for business logic if needed
  // Your existing plantController.bulkImport
);

export default router;

/**
 * Integration Instructions:
 * 
 * 1. Replace your existing route definitions with these validated versions
 * 2. Import your controller functions and add them after the validation middleware
 * 3. The validation middleware will run before your controllers, ensuring clean data
 * 4. Validation errors will be automatically handled and returned as structured responses
 * 
 * Example complete route:
 * router.post('/plants',
 *   validateRequest('body', validationSchemas.plant.create),
 *   plantController.create
 * );
 * 
 * Benefits:
 * - Automatic input validation and sanitization
 * - Consistent error responses
 * - Type safety with TypeScript
 * - XSS protection
 * - File upload validation
 * - Cross-field and conditional validation
 * - Business logic validation specific to AgroTrack
 */