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
import { BugReport, IBugReport } from '../models/BugReport';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Submit a new bug report
 * POST /api/bug-reports
 */
export const submitBugReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
      return;
    }

    // Create bug report
    const bugReport = new BugReport({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await bugReport.save();

    logger.info(`Bug report submitted by ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully. We will review it and get back to you.',
      data: {
        id: bugReport._id,
        status: bugReport.status,
        createdAt: bugReport.createdAt
      }
    });
  } catch (error) {
    logger.error('Error submitting bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit bug report. Please try again later.'
    });
  }
};

/**
 * Get all bug reports for current user
 * GET /api/bug-reports
 */
export const getMyBugReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email || req.query.email;

    if (!userEmail) {
      res.status(400).json({
        success: false,
        message: 'User email is required'
      });
      return;
    }

    const bugReports = await BugReport.find({ email: userEmail.toLowerCase() })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: bugReports
    });
  } catch (error) {
    logger.error('Error fetching user bug reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug reports'
    });
  }
};

/**
 * Get a single bug report by ID
 * GET /api/bug-reports/:id
 */
export const getBugReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    const bugReport = await BugReport.findById(id);

    if (!bugReport) {
      res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
      return;
    }

    // Users can only view their own bug reports unless they're admin
    if (userEmail && bugReport.email !== userEmail.toLowerCase() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: bugReport
    });
  } catch (error) {
    logger.error('Error fetching bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug report'
    });
  }
};

/**
 * Delete a bug report
 * DELETE /api/bug-reports/:id
 */
export const deleteBugReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    const bugReport = await BugReport.findById(id);

    if (!bugReport) {
      res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
      return;
    }

    // Users can only delete their own bug reports unless they're admin
    if (userEmail && bugReport.email !== userEmail.toLowerCase() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    await BugReport.findByIdAndDelete(id);

    logger.info(`Bug report ${id} deleted by ${userEmail || 'unknown user'}`);

    res.json({
      success: true,
      message: 'Bug report deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bug report'
    });
  }
};
