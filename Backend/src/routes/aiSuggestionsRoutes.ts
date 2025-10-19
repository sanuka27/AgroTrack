// AI Smart Suggestions Routes
import express from 'express';
import * as aiSuggestionsController from '../controllers/aiSuggestionsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/ai/suggestions/generate
 * @desc    Generate AI suggestions for user's plants
 * @access  Private
 */
router.post('/generate', aiSuggestionsController.generateSuggestions);

/**
 * @route   GET /api/ai/suggestions
 * @desc    Get user's AI suggestions
 * @access  Private
 */
router.get('/', aiSuggestionsController.getSuggestions);

/**
 * @route   PUT /api/ai/suggestions/:id/read
 * @desc    Mark suggestion as read
 * @access  Private
 */
router.put('/:id/read', aiSuggestionsController.markAsRead);

/**
 * @route   PUT /api/ai/suggestions/:id/dismiss
 * @desc    Dismiss a suggestion
 * @access  Private
 */
router.put('/:id/dismiss', aiSuggestionsController.dismissSuggestion);

/**
 * @route   PUT /api/ai/suggestions/:id/action
 * @desc    Mark suggestion as actioned
 * @access  Private
 */
router.put('/:id/action', aiSuggestionsController.actionSuggestion);

export default router;
