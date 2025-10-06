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
import { ContactMessage } from '../models/ContactMessage';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Submit a new contact message
 * POST /api/contact
 */
export const submitContactMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    // Create contact message
    const contactMessage = new ContactMessage({
      userId: req.user?._id, // Optional - user might not be logged in
      name,
      email,
      subject,
      message,
      status: 'new',
      priority: 'normal', // Default priority
    });

    await contactMessage.save();

    logger.info('Contact message submitted', {
      messageId: contactMessage._id,
      userId: req.user?._id,
      email,
      subject,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: {
        message: contactMessage,
      },
    });
  } catch (error) {
    logger.error('Error submitting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all contact messages for current user
 * GET /api/contact
 */
export const getMyContactMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const contactMessages = await ContactMessage.find({
      $or: [
        { userId: req.user._id },
        { email: req.user.email },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('respondedBy', 'name email');

    res.json({
      success: true,
      data: {
        messages: contactMessages,
        total: contactMessages.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single contact message by ID
 * GET /api/contact/:id
 */
export const getContactMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contactMessage = await ContactMessage.findById(id)
      .populate('userId', 'name email')
      .populate('respondedBy', 'name email');

    if (!contactMessage) {
      res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
      return;
    }

    // Check if user has access to this contact message
    if (
      req.user &&
      contactMessage.userId?.toString() !== req.user._id &&
      contactMessage.email !== req.user.email
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
        message: contactMessage,
      },
    });
  } catch (error) {
    logger.error('Error fetching contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
