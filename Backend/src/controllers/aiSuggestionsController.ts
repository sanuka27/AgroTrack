// AI Smart Suggestions Controller
import { Request, Response } from 'express';
import * as smartSuggestionsService from '../ai/smartSuggestions';
import { logger } from '../config/logger';

/**
 * Generate AI suggestions for user's plants
 * POST /api/ai/suggestions/generate
 */
export const generateSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { plantId } = req.body;

    logger.info(`Generating AI suggestions for user ${userId}${plantId ? ` and plant ${plantId}` : ''}`);

    const suggestions = await smartSuggestionsService.analyzePlantAndGenerateSuggestions(
      userId,
      plantId
    );

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length
      },
      message: `Generated ${suggestions.length} smart suggestions`
    });
  } catch (error: any) {
    logger.error('Error generating AI suggestions:', error);
    // If AI model/service is not available, return 503 with a helpful message
    if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('ai service not available')) {
      res.status(503).json({
        success: false,
        error: 'AI service unavailable. Please configure GEMINI_API_KEY or check AI provider status.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI suggestions'
    });
  }
};

/**
 * Get user's AI suggestions
 * GET /api/ai/suggestions
 */
export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { includeRead, includeDismissed, limit } = req.query;

    const suggestions = await smartSuggestionsService.getUserSuggestions(userId, {
      includeRead: includeRead === 'true',
      includeDismissed: includeDismissed === 'true',
      limit: limit ? parseInt(limit as string) : 10
    });

    // Group suggestions by type for easier display
    const grouped = {
      pro_tips: suggestions.filter(s => s.type === 'pro_tip'),
      growth_insights: suggestions.filter(s => s.type === 'growth_insight'),
      alerts: suggestions.filter(s => s.type === 'alert'),
      care_reminders: suggestions.filter(s => s.type === 'care_reminder'),
      health_warnings: suggestions.filter(s => s.type === 'health_warning')
    };

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        grouped,
        total: suggestions.length
      }
    });
  } catch (error: any) {
    logger.error('Error fetching AI suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch AI suggestions'
    });
  }
};

/**
 * Mark suggestion as read
 * PUT /api/ai/suggestions/:id/read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await smartSuggestionsService.markSuggestionAsRead(id);

    res.status(200).json({
      success: true,
      message: 'Suggestion marked as read'
    });
  } catch (error: any) {
    logger.error('Error marking suggestion as read:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark suggestion as read'
    });
  }
};

/**
 * Dismiss a suggestion
 * PUT /api/ai/suggestions/:id/dismiss
 */
export const dismissSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await smartSuggestionsService.dismissSuggestion(id);

    res.status(200).json({
      success: true,
      message: 'Suggestion dismissed'
    });
  } catch (error: any) {
    logger.error('Error dismissing suggestion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to dismiss suggestion'
    });
  }
};

/**
 * Mark suggestion as actioned
 * PUT /api/ai/suggestions/:id/action
 */
export const actionSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await smartSuggestionsService.actionSuggestion(id);

    res.status(200).json({
      success: true,
      message: 'Suggestion marked as actioned'
    });
  } catch (error: any) {
    logger.error('Error actioning suggestion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to action suggestion'
    });
  }
};
