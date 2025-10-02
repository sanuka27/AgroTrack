import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { PlantController } from '../controllers/plantController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { cacheMiddleware, invalidateCache } from '../middleware/cacheMiddleware';

const router = express.Router();

// Rate limiting for plant operations
const plantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    error: 'Too many plant requests from this IP, please try again later.'
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
const createPlantValidation = [
  body('name')
    .notEmpty()
    .withMessage('Plant name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Plant name must be between 1 and 100 characters')
    .trim(),
  
  body('species')
    .notEmpty()
    .withMessage('Plant species is required')
    .isLength({ min: 1, max: 150 })
    .withMessage('Plant species must be between 1 and 150 characters')
    .trim(),
  
  body('category')
    .isIn(['houseplant', 'vegetable', 'herb', 'flower', 'tree', 'succulent'])
    .withMessage('Category must be one of: houseplant, vegetable, herb, flower, tree, succulent'),
  
  body('variety')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Variety cannot exceed 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters')
    .trim(),
  
  body('potSize')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Pot size cannot exceed 50 characters')
    .trim(),
  
  body('potType')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Pot type cannot exceed 50 characters')
    .trim(),
  
  body('soilType')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Soil type cannot exceed 100 characters')
    .trim(),
  
  body('acquisitionDate')
    .optional()
    .isISO8601()
    .withMessage('Acquisition date must be a valid date'),
  
  body('acquisitionSource')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Acquisition source cannot exceed 200 characters')
    .trim(),
  
  // Care instructions validation
  body('careInstructions.watering.frequency')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Watering frequency must be between 1 and 365 days'),
  
  body('careInstructions.watering.amount')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Watering amount cannot exceed 100 characters'),
  
  body('careInstructions.watering.method')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Watering method cannot exceed 100 characters'),
  
  body('careInstructions.watering.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Watering notes cannot exceed 500 characters'),
  
  body('careInstructions.lighting.type')
    .optional()
    .isIn(['direct', 'indirect', 'low', 'bright'])
    .withMessage('Lighting type must be direct, indirect, low, or bright'),
  
  body('careInstructions.lighting.hours')
    .optional()
    .isInt({ min: 0, max: 24 })
    .withMessage('Lighting hours must be between 0 and 24'),
  
  body('careInstructions.lighting.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Lighting notes cannot exceed 500 characters'),
  
  body('careInstructions.fertilizing.frequency')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Fertilizing frequency must be between 1 and 365 days'),
  
  body('careInstructions.fertilizing.type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Fertilizer type cannot exceed 100 characters'),
  
  body('careInstructions.fertilizing.season')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Fertilizing season cannot exceed 50 characters'),
  
  body('careInstructions.fertilizing.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Fertilizing notes cannot exceed 500 characters'),
  
  body('careInstructions.temperature.min')
    .optional()
    .isInt({ min: -50, max: 60 })
    .withMessage('Minimum temperature must be between -50°C and 60°C'),
  
  body('careInstructions.temperature.max')
    .optional()
    .isInt({ min: -50, max: 60 })
    .withMessage('Maximum temperature must be between -50°C and 60°C'),
  
  body('careInstructions.temperature.optimal')
    .optional()
    .isInt({ min: -50, max: 60 })
    .withMessage('Optimal temperature must be between -50°C and 60°C'),
  
  body('careInstructions.temperature.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Temperature notes cannot exceed 500 characters'),
  
  body('careInstructions.humidity.min')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum humidity must be between 0% and 100%'),
  
  body('careInstructions.humidity.max')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Maximum humidity must be between 0% and 100%'),
  
  body('careInstructions.humidity.optimal')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Optimal humidity must be between 0% and 100%'),
  
  body('careInstructions.humidity.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Humidity notes cannot exceed 500 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .trim(),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
    .trim()
];

const updatePlantValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Plant name must be between 1 and 100 characters')
    .trim(),
  
  body('species')
    .optional()
    .isLength({ min: 1, max: 150 })
    .withMessage('Plant species must be between 1 and 150 characters')
    .trim(),
  
  body('category')
    .optional()
    .isIn(['houseplant', 'vegetable', 'herb', 'flower', 'tree', 'succulent'])
    .withMessage('Category must be one of: houseplant, vegetable, herb, flower, tree, succulent'),
  
  // Include all optional validations from create
  ...createPlantValidation.filter(validation => 
    validation.toString().includes('optional')
  )
];

const searchPlantsValidation = [
  query('q')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Search query cannot exceed 200 characters'),
  
  query('category')
    .optional()
    .isIn(['houseplant', 'vegetable', 'herb', 'flower', 'tree', 'succulent'])
    .withMessage('Category must be one of: houseplant, vegetable, herb, flower, tree, succulent'),
  
  query('tags')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Tags parameter cannot exceed 500 characters'),
  
  query('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location filter cannot exceed 100 characters'),
  
  query('healthStatus')
    .optional()
    .isIn(['healthy', 'needs-attention', 'critical', 'unknown'])
    .withMessage('Health status must be healthy, needs-attention, critical, or unknown'),
  
  query('careStatus')
    .optional()
    .isIn(['up-to-date', 'due-soon', 'overdue', 'unknown'])
    .withMessage('Care status must be up-to-date, due-soon, overdue, or unknown'),
  
  query('isPublic')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isPublic filter must be true or false'),
  
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
    .isIn(['name', 'species', 'category', 'location', 'createdAt', 'updatedAt', 'acquisitionDate', 'healthStatus'])
    .withMessage('Sort by must be name, species, category, location, createdAt, updatedAt, acquisitionDate, or healthStatus'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const plantIdValidation = [
  param('plantId')
    .isMongoId()
    .withMessage('Invalid plant ID format')
];

const bulkOperationValidation = [
  body('plantIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Plant IDs must be an array with 1-50 items'),
  
  body('plantIds.*')
    .isMongoId()
    .withMessage('Each plant ID must be a valid MongoDB ObjectId'),
  
  body('operation')
    .isIn(['delete', 'updateLocation', 'updateTags', 'updatePublic'])
    .withMessage('Operation must be delete, updateLocation, updateTags, or updatePublic'),
  
  body('data.location')
    .if(body('operation').equals('updateLocation'))
    .notEmpty()
    .withMessage('Location is required for updateLocation operation')
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  
  body('data.tags')
    .if(body('operation').equals('updateTags'))
    .isArray()
    .withMessage('Tags must be an array for updateTags operation'),
  
  body('data.tags.*')
    .if(body('operation').equals('updateTags'))
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  
  body('data.isPublic')
    .if(body('operation').equals('updatePublic'))
    .isBoolean()
    .withMessage('isPublic must be a boolean for updatePublic operation')
];

const importPlantsValidation = [
  body('plants')
    .isArray({ min: 1, max: 100 })
    .withMessage('Plants must be an array with 1-100 items'),
  
  body('overwrite')
    .optional()
    .isBoolean()
    .withMessage('Overwrite must be a boolean'),
  
  // Validate each plant in the array
  body('plants.*.name')
    .notEmpty()
    .withMessage('Each plant must have a name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Plant names must be between 1 and 100 characters'),
  
  body('plants.*.species')
    .notEmpty()
    .withMessage('Each plant must have a species')
    .isLength({ min: 1, max: 150 })
    .withMessage('Plant species must be between 1 and 150 characters'),
  
  body('plants.*.category')
    .isIn(['houseplant', 'vegetable', 'herb', 'flower', 'tree', 'succulent'])
    .withMessage('Each plant category must be one of: houseplant, vegetable, herb, flower, tree, succulent'),
  
  body('plants.*.location')
    .notEmpty()
    .withMessage('Each plant must have a location')
    .isLength({ min: 1, max: 100 })
    .withMessage('Plant locations must be between 1 and 100 characters')
];

// Plant CRUD routes
router.post('/', 
  plantRateLimit,
  authMiddleware,
  invalidateCache((req) => [
    `plants:user:${(req.user as any).id}*`,
    `plants:analytics:user:${(req.user as any).id}*`,
    'plants:categories:all'
  ]),
  createPlantValidation,
  validate,
  PlantController.createPlant
);

router.get('/', 
  plantRateLimit,
  authMiddleware,
  cacheMiddleware({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => `plants:user:${(req.user as any).id}:${JSON.stringify(req.query)}`,
    varyBy: ['user-agent']
  }),
  searchPlantsValidation,
  validate,
  PlantController.getPlants
);

router.get('/categories', 
  plantRateLimit,
  authMiddleware,
  cacheMiddleware({
    ttl: 1800, // 30 minutes
    keyGenerator: () => 'plants:categories:all'
  }),
  PlantController.getPlantCategories
);

router.get('/analytics', 
  plantRateLimit,
  authMiddleware,
  cacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => `plants:analytics:user:${(req.user as any).id}:${JSON.stringify(req.query)}`
  }),
  PlantController.getPlantAnalytics
);

router.get('/:plantId', 
  plantRateLimit,
  authMiddleware,
  cacheMiddleware({
    ttl: 900, // 15 minutes
    keyGenerator: (req) => `plant:details:${req.params.plantId}`
  }),
  plantIdValidation,
  validate,
  PlantController.getPlantById
);

router.put('/:plantId', 
  plantRateLimit,
  authMiddleware,
  invalidateCache((req) => [
    `plant:details:${req.params.plantId}`,
    `plants:user:${(req.user as any).id}*`,
    `plants:analytics:user:${(req.user as any).id}*`
  ]),
  plantIdValidation,
  updatePlantValidation,
  validate,
  PlantController.updatePlant
);

router.delete('/:plantId', 
  plantRateLimit,
  authMiddleware,
  invalidateCache((req) => [
    `plant:details:${req.params.plantId}`,
    `plants:user:${(req.user as any).id}*`,
    `plants:analytics:user:${(req.user as any).id}*`,
    'plants:categories:all'
  ]),
  plantIdValidation,
  validate,
  PlantController.deletePlant
);

// Bulk operations
router.post('/bulk', 
  bulkOperationRateLimit,
  authMiddleware,
  bulkOperationValidation,
  validate,
  PlantController.bulkOperation
);

// Import/Export routes
router.post('/import', 
  bulkOperationRateLimit,
  authMiddleware,
  importPlantsValidation,
  validate,
  PlantController.importPlants
);

router.get('/export/json', 
  plantRateLimit,
  authMiddleware,
  PlantController.exportPlants
);

export default router;