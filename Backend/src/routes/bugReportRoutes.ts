/**
 * Bug Report Routes
 * 
 * Routes for handling bug report operations
 */

import express from 'express';
import {
  submitBugReport,
  getMyBugReports,
  getBugReport,
  deleteBugReport,
} from '../controllers/bugReportController';
import { protect as authenticate } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   POST /api/bug-reports
 * @desc    Submit a new bug report
 * @access  Public (authentication optional)
 */
router.post('/', submitBugReport);

/**
 * @route   GET /api/bug-reports
 * @desc    Get all bug reports for current user
 * @access  Private
 */
router.get('/', authenticate, getMyBugReports);

/**
 * @route   GET /api/bug-reports/:id
 * @desc    Get a single bug report by ID
 * @access  Public (authentication optional, but filters based on ownership)
 */
router.get('/:id', getBugReport);

/**
 * @route   DELETE /api/bug-reports/:id
 * @desc    Delete a bug report
 * @access  Private
 */
router.delete('/:id', authenticate, deleteBugReport);

export default router;
