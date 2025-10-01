import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect as authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  getUserDashboard,
  getPlantHealthAnalytics,
  getCareEffectivenessAnalytics,
  getGrowthAnalytics,
  getSystemMetrics,
  updateDashboardWidget,
  analyticsFiltersValidation,
  updateWidgetValidation
} from '../controllers/analyticsController';

const router = express.Router();

// Rate limiting for analytics operations
const analyticsReadLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow more reads for analytics
  message: {
    success: false,
    message: 'Too many analytics requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const analyticsUpdateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit updates
  message: {
    success: false,
    message: 'Too many analytics update requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication to all routes
router.use(authMiddleware);

// Dashboard routes
router.get(
  '/dashboard',
  analyticsReadLimit,
  getUserDashboard
);

router.put(
  '/dashboard/widget',
  analyticsUpdateLimit,
  updateWidgetValidation,
  validate,
  updateDashboardWidget
);

// Plant health analytics
router.get(
  '/plant-health',
  analyticsReadLimit,
  analyticsFiltersValidation,
  validate,
  getPlantHealthAnalytics
);

// Care effectiveness analytics
router.get(
  '/care-effectiveness',
  analyticsReadLimit,
  analyticsFiltersValidation,
  validate,
  getCareEffectivenessAnalytics
);

// Growth tracking analytics
router.get(
  '/growth',
  analyticsReadLimit,
  analyticsFiltersValidation,
  validate,
  getGrowthAnalytics
);

// System metrics (limited access)
router.get(
  '/system',
  analyticsReadLimit,
  getSystemMetrics
);

export default router;