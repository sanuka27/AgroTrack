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
  listModels,
  ping,
  suggestPlantDefaults,
  analyzePlant,
} from '../controllers/aiChatController';
import { protect as authenticate, optionalAuth } from '../middleware/authMiddleware';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

/**
 * @route   POST /api/ai/chat
 * @desc    Send a message to AI assistant
 * @access  Private
 */
router.post('/chat', optionalAuth, sendMessage);

/**
 * @route   GET /api/ai/chat/history
 * @desc    Get chat history (optionally for a specific session)
 * @access  Private
 */
router.get('/chat/history', authenticate, getChatHistory);

/**
 * @route   GET /api/ai/chat/sessions
 * @desc    Get recent chat sessions
 * @access  Private
 */
router.get('/chat/sessions', authenticate, getRecentSessions);

/**
 * @route   POST /api/ai/chat/feedback
 * @desc    Provide feedback on AI response
 * @access  Private
 */
router.post('/chat/feedback', authenticate, provideFeedback);

/**
 * @route   POST /api/ai/chat/new-session
 * @desc    Start a new chat session
 * @access  Private
 */
router.post('/chat/new-session', authenticate, startNewSession);

/**
 * Utility endpoints
 */
router.get('/ping', ping);
router.get('/list-models', listModels);

/**
 * @route   POST /api/ai/plant/analyze
 * @desc    Analyze plant health from image and/or description
 * @access  Public
 */
router.post(
  '/plant/analyze',
  upload.single('photo'),
  analyzePlant
);

/**
 * Suggest plant defaults by name
 * POST /api/ai/plant/suggest
 */
router.post('/plant/suggest', authenticate, suggestPlantDefaults);

export default router;
