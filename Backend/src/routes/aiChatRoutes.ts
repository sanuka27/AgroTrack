/**
 * AI Chat Routes
 * 
 * Routes for handling AI-powered plant care chat
 */

import express from 'express';
import {
  sendMessage,
  getChatHistory,
  getRecentSessions,
  provideFeedback,
  startNewSession,
} from '../controllers/aiChatController';
import { protect as authenticate } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   POST /api/ai/chat
 * @desc    Send a message to AI assistant
 * @access  Private
 */
router.post('/', authenticate, sendMessage);

/**
 * @route   GET /api/ai/chat/history
 * @desc    Get chat history (optionally for a specific session)
 * @access  Private
 */
router.get('/history', authenticate, getChatHistory);

/**
 * @route   GET /api/ai/chat/sessions
 * @desc    Get recent chat sessions
 * @access  Private
 */
router.get('/sessions', authenticate, getRecentSessions);

/**
 * @route   POST /api/ai/chat/feedback
 * @desc    Provide feedback on AI response
 * @access  Private
 */
router.post('/feedback', authenticate, provideFeedback);

/**
 * @route   POST /api/ai/chat/new-session
 * @desc    Start a new chat session
 * @access  Private
 */
router.post('/new-session', authenticate, startNewSession);

export default router;
