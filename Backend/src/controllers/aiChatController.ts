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
import { logger } from '../config/logger';
import { generatePlantCareAdvice } from '../ai/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AuthRequest extends Request {
  user?: any;
}

const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

/**
 * GET /api/ai/list-models
 * List available Gemini models using the REST API (no SDK required)
 */
export const listModels = async (_req: Request, res: Response): Promise<void> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ success: false, message: 'GEMINI_API_KEY is missing in .env' });
    return;
  }

  try {
    const url = `${GEMINI_REST_BASE}/models?key=${encodeURIComponent(key)}`;
    const resp = await fetch(url);
    const text = await resp.text();
    if (!resp.ok) {
      res.status(resp.status).json({ success: false, message: 'Failed to list models from Gemini', details: text });
      return;
    }

    const json = JSON.parse(text);
    const models = (json.models ?? []).map((m: any) => ({
      name: m?.name,
      displayName: m?.displayName,
      version: m?.version,
      supported: m?.supportedGenerationMethods ?? [],
      inputTokenLimit: m?.inputTokenLimit,
      outputTokenLimit: m?.outputTokenLimit,
    }));

    res.json({ success: true, models, nextPageToken: json.nextPageToken });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? 'Unexpected error while listing models' });
  }
};

export const ping = async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, where: '/api/ai/ping' });
};

/**
 * Suggest plant defaults based on name using Gemini AI
 * POST /api/ai/plant/suggest
 */
export const suggestPlantDefaults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plantName = String(req.body?.plantName || req.body?.name || '').trim();
    if (!plantName) {
      res.status(400).json({ success: false, message: 'plantName is required' });
      return;
    }

    const makePrompt = (name: string) => ({
      role: 'user',
      parts: [
        {
          text:
`You are a horticulture assistant. Return ONLY valid JSON (no prose, no fences).
Schema:
{
  "category": string,                  // e.g., "Indoor", "Outdoor", "Herb", "Shrub", "Tree", "Houseplant"
  "sunlight": "Full Sun" | "Partial Sun" | "Indirect Light" | "Shade",
  "wateringFrequencyDays": number|null, // days between typical watering
  "fertilizerScheduleWeeks": number|null, // weeks between fertilizing
  "soilType": string,                  // e.g., "Well-draining potting mix"
  "notes": string                      // short practical notes
}
Rules:
- If uncertain, use null for the numeric fields and still fill the rest sensibly.
- Tailor to typical home gardening care (not commercial farming).
- For succulents, expect long watering intervals and well-draining mix.
- For tropical houseplants, prefer bright indirect light and well-draining mix.

Plant name: ${name}`
        }
      ]
    });

    const model = genAI.getGenerativeModel({ model: MODEL });

    // Try generating up to N attempts if output is incomplete/truncated
    const MAX_ATTEMPTS = 2;
    let lastRaw = '';
    let parsed: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const result = await model.generateContent({
        contents: [makePrompt(plantName)],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      });

      const resp = await result.response;
      let text = '';
      if (resp && typeof (resp as any).text === 'function') text = (resp as any).text();
      else if ((resp as any)?.candidates?.length) text = (resp as any).candidates[0]?.content?.parts?.map((p: any) => p.text).join('') || '';

      text = stripCodeFences(text || '');
      lastRaw = text;

      try {
        parsed = extractJson(text);
      } catch (e) {
        // try parse fallback or continue to next attempt
        parsed = null;
      }

      // If parsed and has at least some non-null fields, break
      const hasSome = parsed && (
        (parsed.wateringFrequencyDays != null && parsed.wateringFrequencyDays !== '') ||
        (parsed.fertilizerScheduleWeeks != null && parsed.fertilizerScheduleWeeks !== '') ||
        (parsed.notes && String(parsed.notes).trim().length > 5)
      );

      if (parsed && hasSome) {
        break;
      }

      // If not last attempt, continue to retry
      if (attempt < MAX_ATTEMPTS) {
        logger.warn(`AI suggest attempt ${attempt} incomplete for "${plantName}", retrying...`);
        await new Promise((r) => setTimeout(r, 400)); // small backoff
        continue;
      }
    }

    // If parse failed entirely, return safe defaults + raw text for debugging
    if (!parsed) {
      const fallback = {
        category: '',
        sunlight: 'Indirect Light',
        wateringFrequencyDays: null,
        fertilizerScheduleWeeks: null,
        soilType: '',
        notes: lastRaw || '',
      };
  res.status(200).json({ success: true, data: fallback, _raw: lastRaw });
  return;
    }

    // Normalize parsed -> suggestion with sensible defaults when missing
    const suggestion = {
      category: String(parsed.category ?? '').trim() || '',
      sunlight: String(parsed.sunlight ?? '').trim() || 'Indirect Light',
      wateringFrequencyDays: typeof parsed.wateringFrequencyDays === 'number' ? parsed.wateringFrequencyDays : (parsed.wateringFrequencyDays ? Number(parsed.wateringFrequencyDays) : null),
      fertilizerScheduleWeeks: typeof parsed.fertilizerScheduleWeeks === 'number' ? parsed.fertilizerScheduleWeeks : (parsed.fertilizerScheduleWeeks ? Number(parsed.fertilizerScheduleWeeks) : null),
      soilType: String(parsed.soilType ?? parsed.soil ?? '').trim() || '',
      notes: String(parsed.notes ?? '').trim() || lastRaw || '',
    };

    // If numeric fields are still null, provide conservative defaults for common categories
    if (suggestion.wateringFrequencyDays == null) {
      if ((suggestion.category || '').toLowerCase().includes('succulent')) suggestion.wateringFrequencyDays = 21;
      else suggestion.wateringFrequencyDays = 7; // safe default weekly
    }
    if (suggestion.fertilizerScheduleWeeks == null) {
      suggestion.fertilizerScheduleWeeks = 12; // quarterly as conservative default
    }

  res.json({ success: true, data: suggestion, _raw: lastRaw });
  return;
  } catch (error: any) {
    logger.error('suggestPlantDefaults error', error);
    
    // Check if it's a rate limit error
    const isRateLimit = error?.message?.includes('quota') || 
                        error?.message?.includes('429') ||
                        error?.message?.includes('Too Many Requests') ||
                        error?.status === 429;
    
    if (isRateLimit) {
      res.status(429).json({ 
        success: false, 
        message: 'AI rate limit exceeded. Please try again later or add plant details manually.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: error?.message || 'AI service temporarily unavailable'
      });
    }
  }
};

/**
 * Send a message to AI assistant
 * POST /api/ai/chat
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isGuest = !req.user;
    
    if (isGuest) {
      // Handle guest user - skip persistence
      const { content, careType } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message content is required',
        });
        return;
      }

      const aiResponse = await generatePlantCareAdvice(content, {
        careType,
        chatHistory: [],
      });

      logger.info('Guest AI chat message processed', {
        messageLength: content.length,
        responseLength: aiResponse.text.length,
      });

      res.json({
        success: true,
        data: {
          response: {
            content: aiResponse.text,
            role: 'assistant',
            metadata: {
              careType,
              confidence: aiResponse.confidence,
            },
          },
        },
      });
      return;
    }

    // Handle authenticated user - stateless (no DB persistence)
    const { content, plantId, careType } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
      return;
    }

    try {
      const aiResponse = await generatePlantCareAdvice(content, {
        plantId,
        careType,
        chatHistory: [],
      });

      logger.info('AI chat message processed (stateless)', {
        userId: req.user._id,
        messageLength: content.length,
        responseLength: aiResponse.text.length,
      });

      res.json({
        success: true,
        data: {
          response: {
            content: aiResponse.text,
            role: 'assistant',
            metadata: {
              plantId,
              careType,
              suggestions: aiResponse.suggestions,
              confidence: aiResponse.confidence,
            },
            model: 'gemini-pro',
            tokens: aiResponse.tokens,
          },
        },
      });
    } catch (aiError) {
      logger.error('AI processing error:', aiError);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI response',
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
    // Persistence for chat history is disabled in current setup
    res.json({ success: true, data: { messages: [], sessionId: null } });
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
    // Persistence for chat sessions is disabled in current setup
    res.json({ success: true, data: { sessions: [] } });
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
    // Feedback persistence disabled in current setup
    res.json({ success: true, message: 'Thank you for your feedback!' });
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

/**
 * POST /api/ai/plant/analyze
 * Analyze plant health from image and/or description
 */
export const analyzePlant = async (req: Request, res: Response): Promise<void> => {
  try {
    const description = (req.body?.description || "").toString().trim();
    const file = (req as any).file;

    if (!description && !file) {
      res.status(400).json({ success: false, message: 'Provide a description or a photo.' });
      return;
    }

    const parts: any[] = [];
    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype || 'image/jpeg',
        },
      });
    }
    parts.push({
      text: `You are an expert plant pathologist. Analyze this plant issue and return ONLY pure JSON (no code fences).

Required JSON structure:
{
  "likelyDiseases": [{"name": string, "confidence": "low"|"medium"|"high", "why": string}],
  "urgency": "low"|"medium"|"high",
  "careSteps": [string],
  "prevention": [string]
}

IMPORTANT - You MUST provide detailed arrays:
- careSteps: MUST contain at least 4-6 specific, actionable treatment steps with timing details
- prevention: MUST contain at least 4-6 practical prevention measures for future plant health

Example careSteps format:
[
  "Immediately isolate the affected plant from other plants to prevent disease spread",
  "Remove all visibly infected leaves using sterilized pruning shears, cutting 1 inch below affected areas",
  "Apply fungicide spray (copper-based or neem oil) to all remaining foliage every 7-10 days for 3 weeks",
  "Reduce watering frequency by 30-40% and ensure soil dries between waterings",
  "Improve air circulation around the plant by spacing it 6-12 inches from neighbors",
  "Monitor daily for 2 weeks and remove any new infected growth immediately"
]

Example prevention format:
[
  "Water only in the morning to allow foliage to dry before nightfall",
  "Maintain proper spacing between plants (minimum 6 inches) for air circulation",
  "Inspect plants weekly for early signs of disease or pest activity",
  "Apply preventive fungicide monthly during humid or rainy seasons",
  "Avoid overhead watering; use drip irrigation or water at soil level",
  "Sterilize pruning tools with rubbing alcohol between each cut"
]

User's plant issue description: ${description}

Provide comprehensive, actionable guidance with specific timing and measurements.`,
    });

    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    // --- robust response extraction
    const resp = result?.response;
    let text = '';
    if (resp && typeof resp.text === 'function') {
      text = resp.text();
    } else if (resp?.candidates?.length) {
      text = resp.candidates[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    }

    if (!text) {
      res.status(502).json({ success: false, message: 'No text returned by Gemini.' });
      return;
    }

    let data: any;
    try {
      data = extractJson(text);
    } catch (e) {
      // keep raw text for debugging if parse still fails
      res.json({ success: true, model: MODEL, data: { rawText: text } });
      return;
    }

    res.json({
      success: true,
      model: MODEL,
      data,
    });
  } catch (err: any) {
    logger.error('[plant/analyze] error:', err?.message || err);
    res.status(500).json({ success: false, message: 'AI analysis failed', error: err?.message });
  }
};

// --- helper: scrub + parse JSON text safely
function toPlainQuotes(s: string) {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}
function stripCodeFences(s: string) {
  return s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1');
}
function stripOutsideBraces(s: string) {
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  return first >= 0 && last > first ? s.slice(first, last + 1) : s;
}
function stripTrailingCommas(s: string) {
  // remove trailing commas before } or ]
  return s.replace(/,\s*([}\]])/g, '$1');
}
function parseMaybeDoubleEncoded(s: string) {
  // If it looks like a quoted JSON string, unquote and parse again
  const looksStringified = /^\s*"/.test(s.trim());
  if (looksStringified) {
    const once = JSON.parse(s);
    return typeof once === 'string' ? JSON.parse(once) : once;
  }
  return JSON.parse(s);
}
function extractJson(text: string) {
  let t = text || '';
  t = toPlainQuotes(t);
  t = stripCodeFences(t);
  t = stripOutsideBraces(t);
  t = stripTrailingCommas(t);
  return parseMaybeDoubleEncoded(t);
}
