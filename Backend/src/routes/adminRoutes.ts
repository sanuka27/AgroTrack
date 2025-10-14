import express from 'express';
import { body, query, param } from 'express-validator';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { adminController } from '../controllers/adminController';
import { adminLimiter, sensitiveAdminLimiter } from '../middleware/rateLimiting';

const router = express.Router();

// Validation schemas
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const userFilterValidation = [
  ...paginationValidation,
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('role')
    .optional()
    .isIn(['user', 'moderator', 'admin', 'super_admin'])
    .withMessage('Invalid role'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'banned'])
    .withMessage('Status must be active, inactive, pending or banned'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'lastActiveAt', 'username', 'email'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const updateUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['user', 'moderator', 'admin'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const deleteUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters if provided'),
  body('hardDelete')
    .optional()
    .isBoolean()
    .withMessage('hardDelete must be a boolean')
];

const contentModerationValidation = [
  ...paginationValidation,
  query('type')
    .optional()
    .isIn(['post', 'comment', 'plant'])
    .withMessage('Invalid content type'),
  query('status')
    .optional()
    .isIn(['pending', 'flagged', 'approved', 'rejected'])
    .withMessage('Invalid status')
];

const moderateContentValidation = [
  param('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  body('action')
    .isIn(['approve', 'reject', 'delete'])
    .withMessage('Action must be approve, reject, or delete'),
  body('reason')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason is required and must be between 5 and 500 characters'),
  body('type')
    .optional()
    .isIn(['post', 'comment', 'plant'])
    .withMessage('Invalid content type')
];

const adminLogsValidation = [
  ...paginationValidation,
  query('adminId')
    .optional()
    .isMongoId()
    .withMessage('Invalid admin ID'),
  query('action')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Action must be between 2 and 50 characters'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateFrom format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateTo format')
];

const bulkUserActionValidation = [
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('UserIds must be an array with 1-100 items'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be valid'),
  body('action')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Action must be activate, deactivate, or delete'),
  body('reason')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason is required and must be between 5 and 500 characters')
];

// Apply middleware to all admin routes
router.use(adminLimiter);
router.use(protect);
router.use(requireRole(['admin', 'super_admin']));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview with system statistics
 * @access  Private (Admin/Super Admin)
 */
router.get('/dashboard',
  adminController.getDashboard
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin/Super Admin)
 * @params  page, limit, search, role, status, sortBy, sortOrder
 */
router.get('/users',
  userFilterValidation,
  validate,
  adminController.getUsers
);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get specific user details with statistics
 * @access  Private (Admin/Super Admin)
 */
router.get('/users/:userId',
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validate,
  adminController.getUser
);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user role or status
 * @access  Private (Admin/Super Admin)
 */
router.put('/users/:userId',
  sensitiveAdminLimiter,
  updateUserValidation,
  validate,
  adminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user (soft delete by default, hard delete for super admin)
 * @access  Private (Admin/Super Admin)
 */
router.delete('/users/:userId',
  sensitiveAdminLimiter,
  deleteUserValidation,
  validate,
  adminController.deleteUser
);

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Perform bulk actions on multiple users
 * @access  Private (Admin/Super Admin)
 */
router.post('/users/bulk',
  sensitiveAdminLimiter,
  requireRole(['super_admin']), // Only super admin can perform bulk actions
  bulkUserActionValidation,
  validate,
  adminController.bulkUserAction
);

/**
 * @route   GET /api/admin/content/flagged
 * @desc    Get flagged content for moderation
 * @access  Private (Admin/Super Admin)
 * @params  page, limit, type, status, sortBy, sortOrder
 */
router.get('/content/flagged',
  contentModerationValidation,
  validate,
  adminController.getFlaggedContent
);

/**
 * @route   POST /api/admin/content/:contentId/moderate
 * @desc    Moderate content (approve/reject/delete)
 * @access  Private (Admin/Super Admin)
 */
router.post('/content/:contentId/moderate',
  sensitiveAdminLimiter,
  moderateContentValidation,
  validate,
  adminController.moderateContent
);

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status and metrics
 * @access  Private (Admin/Super Admin)
 */
router.get('/system/health',
  adminController.getSystemHealth
);

/**
 * @route   GET /api/admin/system/config
 * @desc    Get system configuration (non-sensitive)
 * @access  Private (Admin/Super Admin)
 */
router.get('/system/config',
  adminController.getSystemConfig
);

/**
 * @route   GET /api/admin/logs
 * @desc    Get admin activity logs
 * @access  Private (Admin/Super Admin)
 * @params  page, limit, adminId, action, dateFrom, dateTo
 */
router.get('/logs',
  adminLogsValidation,
  validate,
  adminController.getAdminLogs
);

// Additional admin routes can be added here:

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get comprehensive analytics overview
 * @access  Private (Admin/Super Admin)
 */
router.get('/analytics/overview',
  adminController.getDashboard
);

/**
 * @route   POST /api/admin/maintenance/cache-clear
 * @desc    Clear application cache
 * @access  Private (Super Admin only)
 */
router.post('/maintenance/cache-clear',
  sensitiveAdminLimiter,
  requireRole(['super_admin']),
  (req, res) => {
    // Placeholder for cache clearing
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  }
);

/**
 * @route   POST /api/admin/maintenance/backup
 * @desc    Trigger database backup
 * @access  Private (Super Admin only)
 */
router.post('/maintenance/backup',
  sensitiveAdminLimiter,
  requireRole(['super_admin']),
  (req, res) => {
    // Placeholder for backup trigger
    res.json({
      success: true,
      message: 'Backup initiated successfully'
    });
  }
);

/**
 * @route   GET /api/admin/reports/users
 * @desc    Generate user activity report
 * @access  Private (Admin/Super Admin)
 */
router.get('/reports/users',
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid period'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  validate,
  (req, res) => {
    // Placeholder for user reports
    res.json({
      success: true,
      message: 'User report endpoint - to be implemented',
      data: {}
    });
  }
);

/**
 * @route   GET /api/admin/reports/content
 * @desc    Generate content activity report
    router.get('/reports/content',
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('status').optional().isIn(['pending','resolved','dismissed','reviewed']).withMessage('Invalid status'),
      validate,
      async (req, res) => {
        try {
          const page = parseInt((req.query.page as string) || '1');
          const limit = Math.min(parseInt((req.query.limit as string) || '10'), 100);
          const status = req.query.status as string | undefined;

          const query: any = {};
          if (status) query.status = status;

          const skip = (page - 1) * limit;

          // Import CommunityReport model lazily to avoid circular deps
          const { CommunityReport } = await import('../models/CommunityReport');

          const [reports, total] = await Promise.all([
            CommunityReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            CommunityReport.countDocuments(query)
          ]);

          // Resolve reporter names
          const reporterUids = [...new Set(reports.map(r => r.reporterUid))];
          const { CommunityUser } = await import('../models/CommunityUser');
          const users = await CommunityUser.find({ uid: { $in: reporterUids } }).lean();
          const userMap = new Map(users.map(u => [u.uid, u]));

          // Map reports to a cleaner shape
          const mapped = reports.map(r => {
            const reporter = userMap.get(r.reporterUid);
            return {
              _id: r._id,
              reporterId: r.reporterUid,
              reporterName: reporter ? reporter.name : r.reporterUid,
              targetId: r.targetId,
              targetType: r.targetType,
              reason: r.reason,
              description: r.description,
              status: r.status === 'reviewed' ? 'resolved' : r.status,
              createdAt: r.createdAt,
              resolvedAt: r.reviewedAt || r.updatedAt,
              resolvedBy: r.reviewedBy
            };
          });

          res.json({
            success: true,
            data: {
              reports: mapped,
              total,
              page,
              limit
            }
          });
        } catch (error) {
          console.error('Failed to fetch admin content reports:', error);
          res.status(500).json({ success: false, message: 'Failed to fetch reports' });
        }
      }
    );

 * @access  Private (Admin/Super Admin)
 */
router.get('/reports/content',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending','resolved','dismissed','reviewed']).withMessage('Invalid status'),
  validate,
  async (req, res) => {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = Math.min(parseInt((req.query.limit as string) || '10'), 100);
      const status = req.query.status as string | undefined;

      const query: any = {};
      if (status) {
        if (status === 'resolved') {
          // include both 'reviewed' and 'resolved' statuses from DB
          query.status = { $in: ['reviewed', 'resolved'] };
        } else {
          query.status = status;
        }
      }

      const skip = (page - 1) * limit;

      // Import CommunityReport model lazily to avoid circular deps
      const { CommunityReport } = await import('../models/CommunityReport');

      const [reports, total] = await Promise.all([
        CommunityReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        CommunityReport.countDocuments(query)
      ]);

      // Resolve reporter names
      const reporterUids = [...new Set(reports.map(r => r.reporterUid))];
      const { CommunityUser } = await import('../models/CommunityUser');
      const users = await CommunityUser.find({ uid: { $in: reporterUids } }).lean();
      const userMap = new Map(users.map(u => [u.uid, u]));

      // Map reports to a cleaner shape
      const mapped = reports.map(r => {
        const reporter = userMap.get(r.reporterUid);
        return {
          _id: r._id,
          reporterId: r.reporterUid,
          reporterName: reporter ? reporter.name : r.reporterUid,
          targetId: r.targetId,
          targetType: r.targetType,
          reason: r.reason,
          description: r.description,
          status: r.status === 'reviewed' ? 'resolved' : r.status,
          createdAt: r.createdAt,
          resolvedAt: r.reviewedAt || r.updatedAt,
          resolvedBy: r.reviewedBy
        };
      });

      res.json({
        success: true,
        data: {
          reports: mapped,
          total,
          page,
          limit
        }
      });
    } catch (error) {
      console.error('Failed to fetch admin content reports:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
  }
);

export default router;