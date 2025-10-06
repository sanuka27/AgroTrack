/**
 * AI Chat Controller
 * 
 * Handles AI-powered plant care chat operations:
 * - Send messages to AI assistant (Gemini)
 * - Get chat history
 * - Get recent sessions
 * - Provide feedback on AI responses
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../models/ChatMessage';
import { logger } from '../config/logger';
import { generatePlantCareAdvice } from '../ai/gemini';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Send a message to AI assistant
 * POST /api/ai/chat
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { content, sessionId, plantId, careType } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
      return;
    }

    // Generate or use existing session ID
    const actualSessionId = sessionId || uuidv4();

    // Save user message
    const userMessage = new ChatMessage({
      userId: req.user._id,
      sessionId: actualSessionId,
      role: 'user',
      content: content.trim(),
      metadata: {
        plantId,
        careType,
      },
      model: 'gemini-pro',
    });

    await userMessage.save();

    // Get recent chat history for context (last 10 messages)
    const recentMessages = await ChatMessage.find({
      userId: req.user._id,
      sessionId: actualSessionId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('role content');

    // Format chat history for Gemini
    const chatHistory = recentMessages
      .reverse()
      .map((msg: any) => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

    // Get AI response
    try {
      const aiResponse = await generatePlantCareAdvice(content, {
        plantId,
        careType,
        chatHistory,
      });

      // Save AI response
      const assistantMessage = new ChatMessage({
        userId: req.user._id,
        sessionId: actualSessionId,
        role: 'assistant',
        content: aiResponse.text,
        metadata: {
          plantId,
          careType,
          suggestions: aiResponse.suggestions,
          confidence: aiResponse.confidence,
        },
        model: 'gemini-pro',
        tokens: aiResponse.tokens,
      });

      await assistantMessage.save();

      logger.info('AI chat message processed', {
        userId: req.user._id,
        sessionId: actualSessionId,
        messageLength: content.length,
        responseLength: aiResponse.text.length,
      });

      res.json({
        success: true,
        data: {
          message: userMessage,
          response: assistantMessage,
        },
      });
    } catch (aiError) {
      logger.error('AI processing error:', aiError);
      
      // Save error response
      const errorMessage = new ChatMessage({
        userId: req.user._id,
        sessionId: actualSessionId,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        metadata: {
          error: true,
        },
        model: 'gemini-pro',
      });

      await errorMessage.save();

      res.status(500).json({
        success: false,
        message: 'Failed to get AI response',
        data: {
          message: userMessage,
          response: errorMessage,
        },
      });
    }
  } catch (error) {
    logger.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get chat history
 * GET /api/ai/chat/history
 */
export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { sessionId } = req.query;

    let query: any = { userId: req.user._id };

    // If sessionId provided, get that session's history
    // Otherwise, get the most recent session
    if (sessionId) {
      query.sessionId = sessionId;
    } else {
      // Get the most recent session
      const recentMessage = await ChatMessage.findOne({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .select('sessionId');

      if (recentMessage) {
        query.sessionId = recentMessage.sessionId;
      }
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    res.json({
      success: true,
      data: {
        messages,
        sessionId: messages && messages.length > 0 && messages[0] ? messages[0].sessionId : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get recent chat sessions
 * GET /api/ai/chat/sessions
 */
export const getRecentSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const sessions = await ChatMessage.getRecentSessions(req.user._id);

    res.json({
      success: true,
      data: {
        sessions,
      },
    });
  } catch (error) {
    logger.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Provide feedback on AI message
 * POST /api/ai/chat/feedback
 */
export const provideFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { messageId, helpful, comment } = req.body;

    if (!messageId) {
      res.status(400).json({
        success: false,
        message: 'Message ID is required',
      });
      return;
    }

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found',
      });
      return;
    }

    // Check if message belongs to user
    if (message.userId.toString() !== req.user._id) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    message.helpful = helpful;
    if (comment) {
      message.feedbackComment = comment;
    }

    await message.save();

    logger.info('Chat feedback received', {
      userId: req.user._id,
      messageId,
      helpful,
    });

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    logger.error('Error saving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save feedback',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Start a new chat session
 * POST /api/ai/chat/new-session
 */
export const startNewSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const sessionId = uuidv4();

    logger.info('New chat session started', {
      userId: req.user._id,
      sessionId,
    });

    res.json({
      success: true,
      data: {
        sessionId,
      },
    });
  } catch (error) {
    logger.error('Error starting new session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start new session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
