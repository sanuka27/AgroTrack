import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { query, body } from 'express-validator';
import { searchController } from '../controllers/searchController';
import { searchLimiter } from '../middleware/rateLimiting';

const router = express.Router();

// Validation schemas
const universalSearchValidation = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  
  query('types')
    .optional()
    .isString()
    .custom((value: string) => {
      const validTypes = ['plants', 'careLogs', 'reminders', 'posts'];
      const types = value.split(',');
      const invalidTypes = types.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid content types: ${invalidTypes.join(', ')}`);
      }
      return true;
    }),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) <= new Date(req.query.startDate as string)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  query('categories')
    .optional()
    .isString(),
  
  query('tags')
    .optional()
    .isString(),
  
  query('status')
    .optional()
    .isString(),
  
  query('careTypes')
    .optional()
    .isString()
    .custom((value: string) => {
      const validCareTypes = ['watering', 'fertilizing', 'pruning', 'repotting', 'pest-treatment', 'disease-treatment', 'general', 'observation'];
      const types = value.split(',');
      const invalidTypes = types.filter(type => !validCareTypes.includes(type));
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid care types: ${invalidTypes.join(', ')}`);
      }
      return true;
    }),
  
  query('healthStatus')
    .optional()
    .isString()
    .custom((value: string) => {
      const validStatuses = ['excellent', 'good', 'fair', 'poor', 'critical'];
      const statuses = value.split(',');
      const invalidStatuses = statuses.filter(status => !validStatuses.includes(status));
      if (invalidStatuses.length > 0) {
        throw new Error(`Invalid health statuses: ${invalidStatuses.join(', ')}`);
      }
      return true;
    }),
  
  query('location')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['relevance', 'date', 'title', 'type'])
    .withMessage('Sort by must be one of: relevance, date, title, type'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
];

const suggestionValidation = [
  query('q')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

const plantSearchValidation = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  
  query('categories')
    .optional()
    .isString(),
  
  query('healthStatus')
    .optional()
    .isString()
    .custom((value: string) => {
      const validStatuses = ['excellent', 'good', 'fair', 'poor', 'critical'];
      const statuses = value.split(',');
      const invalidStatuses = statuses.filter(status => !validStatuses.includes(status));
      if (invalidStatuses.length > 0) {
        throw new Error(`Invalid health statuses: ${invalidStatuses.join(', ')}`);
      }
      return true;
    }),
  
  query('location')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'species', 'date', 'healthStatus', 'category'])
    .withMessage('Sort by must be one of: name, species, date, healthStatus, category'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
];

/**
 * @route   GET /api/search
 * @desc    Universal search across all content types
 * @access  Private
 * @params  q (query string), types (comma-separated), startDate, endDate, 
 *          categories, tags, status, careTypes, healthStatus, location,
 *          sortBy, sortOrder, limit, skip
 */
router.get('/',
  searchLimiter,
  protect,
  universalSearchValidation,
  validate,
  searchController.universalSearch
);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions/autocomplete
 * @access  Private
 * @params  q (required query string)
 */
router.get('/suggestions',
  searchLimiter,
  protect,
  suggestionValidation,
  validate,
  searchController.getSearchSuggestions
);

/**
 * @route   GET /api/search/plants
 * @desc    Advanced plant search with filtering
 * @access  Private
 * @params  q (query string), categories, healthStatus, location,
 *          sortBy, sortOrder, limit, skip
 */
router.get('/plants',
  searchLimiter,
  protect,
  plantSearchValidation,
  validate,
  searchController.searchPlants
);

/**
 * @route   GET /api/search/facets
 * @desc    Get search facets for filtering UI
 * @access  Private
 */
router.get('/facets',
  protect,
  searchController.getSearchFacets
);

/**
 * @route   GET /api/search/history
 * @desc    Get user's search history
 * @access  Private
 * @params  limit (optional)
 */
router.get('/history',
  protect,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validate,
  searchController.getSearchHistory
);

/**
 * @route   GET /api/search/trending
 * @desc    Get trending search terms
 * @access  Private
 * @params  days (optional), limit (optional)
 */
router.get('/trending',
  protect,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  searchController.getTrendingSearches
);

/**
 * @route   GET /api/search/analytics
 * @desc    Get search analytics for user
 * @access  Private
 * @params  days (optional)
 */
router.get('/analytics',
  protect,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  validate,
  searchController.getSearchAnalytics
);

/**
 * @route   POST /api/search/track-click
 * @desc    Track search result click for analytics
 * @access  Private
 */
router.post('/track-click',
  protect,
  [
    body('searchId')
      .isMongoId()
      .withMessage('Search ID must be a valid MongoDB ObjectId'),
    
    body('resultId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Result ID is required'),
    
    body('resultType')
      .isIn(['plant', 'careLog', 'reminder', 'post'])
      .withMessage('Result type must be one of: plant, careLog, reminder, post'),
    
    body('position')
      .isInt({ min: 0 })
      .withMessage('Position must be a non-negative integer')
  ],
  validate,
  searchController.trackSearchClick
);

export default router;