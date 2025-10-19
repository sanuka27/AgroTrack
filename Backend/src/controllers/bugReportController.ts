/**
 * Bug Report Controller
 * 
 * Handles bug report operations:
 * - Submit bug reports
 * - Get user's bug reports
 * - Get single bug report
 * - Delete bug report (user can delete their own)
 * - Admin operations in adminController.ts
 */

import { Request, Response } from 'express';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Submit a new bug report
 * POST /api/bug-reports
 */
export const submitBugReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Bug reports feature is not available in this deployment.'
  });
};

/**
 * Get all bug reports for current user
 * GET /api/bug-reports
 */
export const getMyBugReports = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Bug reports feature is not available in this deployment.'
  });
};

/**
 * Get a single bug report by ID
 * GET /api/bug-reports/:id
 */
export const getBugReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Bug reports feature is not available in this deployment.'
  });
};

/**
 * Delete a bug report
 * DELETE /api/bug-reports/:id
 */
export const deleteBugReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Bug reports feature is not available in this deployment.'
  });
};
