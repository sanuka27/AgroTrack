/**
 * Contact Routes
 * 
 * Routes for handling contact form operations
 */

import express from 'express';
import {
  submitContactMessage,
  getMyContactMessages,
  getContactMessage,
} from '../controllers/contactController';
import { protect as authenticate } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Submit a new contact message
 * @access  Public (authentication optional)
 */
router.post('/', submitContactMessage);

/**
 * @route   GET /api/contact
 * @desc    Get all contact messages for current user
 * @access  Private
 */
router.get('/', authenticate, getMyContactMessages);

/**
 * @route   GET /api/contact/:id
 * @desc    Get a single contact message by ID
 * @access  Public (authentication optional, but filters based on ownership)
 */
router.get('/:id', getContactMessage);

export default router;
