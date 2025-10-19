/**
 * Contact Controller
 * 
 * Handles contact form operations:
 * - Submit contact messages
 * - Get user's contact messages
 * - Get single contact message
 * - Admin operations in adminController.ts
 */

import { Request, Response } from 'express';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Submit a new contact message
 * POST /api/contact
 */
export const submitContactMessage = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Contact messages are not available in this deployment.'
  });
};

/**
 * Get all contact messages for current user
 * GET /api/contact
 */
export const getMyContactMessages = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Contact messages are not available in this deployment.'
  });
};

/**
 * Get a single contact message by ID
 * GET /api/contact/:id
 */
export const getContactMessage = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Contact messages are not available in this deployment.'
  });
};
