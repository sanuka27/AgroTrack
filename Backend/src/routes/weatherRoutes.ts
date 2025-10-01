import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { WeatherController } from '../controllers/weatherController';
import { protect as authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';

const router = express.Router();

// Rate limiting for weather operations
const weatherRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per window
  message: {
    error: 'Too many weather requests from this IP, please try again later.'
  }
});

const weatherAPIRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 API calls per window (external API limits)
  message: {
    error: 'Too many weather API requests from this IP, please try again later.'
  }
});

const scheduleUpdateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 schedule updates per hour
  message: {
    error: 'Too many schedule update requests from this IP, please try again later.'
  }
});

// Validation schemas
const coordinatesValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('city')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters')
    .trim()
];

const forecastValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 14 })
    .withMessage('Days must be between 1 and 14')
];

const recommendationsValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId')
];

const alertsValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('activeOnly')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('activeOnly must be true or false')
];

const alertIdValidation = [
  param('alertId')
    .isMongoId()
    .withMessage('Invalid alert ID format')
];

const updateSchedulesValidation = [
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('plantIds')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Plant IDs must be an array with maximum 50 items'),
  
  body('plantIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each plant ID must be a valid MongoDB ObjectId')
];

const weatherStatsValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d'])
    .withMessage('Timeframe must be 7d, 30d, or 90d')
];

// Weather data routes
router.get('/current', 
  weatherAPIRateLimit,
  coordinatesValidation,
  validate,
  WeatherController.getCurrentWeather
);

router.get('/forecast', 
  weatherAPIRateLimit,
  forecastValidation,
  validate,
  WeatherController.getWeatherForecast
);

router.get('/stats', 
  weatherRateLimit,
  weatherStatsValidation,
  validate,
  WeatherController.getWeatherStats
);

// Weather-based recommendations routes
router.get('/recommendations', 
  weatherRateLimit,
  authMiddleware,
  recommendationsValidation,
  validate,
  WeatherController.getWeatherRecommendations
);

// Weather alerts routes
router.get('/alerts', 
  weatherRateLimit,
  authMiddleware,
  alertsValidation,
  validate,
  WeatherController.getWeatherAlerts
);

router.post('/alerts/:alertId/acknowledge', 
  weatherRateLimit,
  authMiddleware,
  alertIdValidation,
  validate,
  WeatherController.acknowledgeAlert
);

// Schedule management routes
router.post('/schedules/update', 
  scheduleUpdateRateLimit,
  authMiddleware,
  updateSchedulesValidation,
  validate,
  WeatherController.updateSchedulesWithWeather
);

export default router;