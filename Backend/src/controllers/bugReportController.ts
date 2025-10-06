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
import { BugReport } from '../models/BugReport';
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
    const { name, email, description } = req.body;

    // Validate required fields
    if (!name || !email || !description) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and description are required',
      });
      return;
    }

    // Create bug report
    const bugReport = new BugReport({
      userId: req.user?._id, // Optional - user might not be logged in
      name,
      email,
      description,
      status: 'new',
      priority: 'medium', // Default priority
      attachments: req.body.attachments || [],
    });

    await bugReport.save();

    logger.info('Bug report submitted', {
      bugReportId: bugReport._id,
      userId: req.user?._id,
      email,
    });

    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully. We will review it soon.',
      data: {
        report: bugReport,
      },
    });
  } catch (error) {
    logger.error('Error submitting bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit bug report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all bug reports for current user
 * GET /api/bug-reports
 */
export const getMyBugReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const bugReports = await BugReport.find({
      $or: [
        { userId: req.user._id },
        { email: req.user.email },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');

    res.json({
      success: true,
      data: {
        reports: bugReports,
        total: bugReports.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching bug reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug reports',
      error: error instanceof Error ? error.message : 'Unknown error',
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

    const bugReport = await BugReport.findById(id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');

    if (!bugReport) {
      res.status(404).json({
        success: false,
        message: 'Bug report not found',
      });
      return;
    }

    // Check if user has access to this bug report
    if (
      req.user &&
      bugReport.userId?.toString() !== req.user._id &&
      bugReport.email !== req.user.email
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        report: bugReport,
      },
    });
  } catch (error) {
    logger.error('Error fetching bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug report',
      error: error instanceof Error ? error.message : 'Unknown error',
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

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const bugReport = await BugReport.findById(id);

    if (!bugReport) {
      res.status(404).json({
        success: false,
        message: 'Bug report not found',
      });
      return;
    }

    // Check if user owns this bug report
    if (
      bugReport.userId?.toString() !== req.user._id &&
      bugReport.email !== req.user.email
    ) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own bug reports',
      });
      return;
    }

    await BugReport.findByIdAndDelete(id);

    logger.info('Bug report deleted', {
      bugReportId: id,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Bug report deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bug report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
