import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY not configured - AI features disabled");
} else {
  console.log("✅ Gemini AI initialized successfully");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

const unavailable = "AI features are disabled. Please configure GEMINI_API_KEY.";

export async function getPlantCareTips(plantName: string, problem: string): Promise<string> {
  if (!model) return unavailable;
  const prompt = `Give me detailed care tips for a ${plantName} showing signs of ${problem}. Include causes, solutions, and prevention tips.`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, I couldn't generate care tips at the moment.";
  }
}

export async function identifyPlantDisease(symptoms: string, imageDescription?: string): Promise<string> {
  if (!model) return unavailable;
  let prompt = `Based on these symptoms: ${symptoms}`;
  if (imageDescription) prompt += ` and this image description: ${imageDescription}`;
  prompt += `, identify possible plant diseases and suggest treatments.`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, I couldn't identify the disease at the moment.";
  }
}

/**
 * Analyze plant disease from an image URL using Gemini Vision
 * @param imageUrl - URL of the plant image to analyze
 * @param symptoms - Optional text description of symptoms
 * @returns Structured disease detection results
 */
export async function identifyPlantDiseaseFromImage(imageUrl: string, symptoms?: string): Promise<any> {
  if (!genAI) throw new Error('AI service unavailable');

  const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Unable to fetch image from URL');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = new Uint8Array(imageBuffer);
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: Buffer.from(imageData).toString('base64'),
        mimeType: mimeType
      }
    };

    let prompt = `You are an expert plant pathologist. Carefully analyze this plant image and identify any diseases, pests, or health issues.`;
    
    if (symptoms) {
      prompt += `\n\nUser-provided context: ${symptoms}`;
    }

    prompt += `

REQUIRED JSON OUTPUT FORMAT:
{
  "diseaseDetected": boolean,
  "confidence": number (0-1),
  "healthyProbability": number (0-1),
  "primaryDisease": {
    "name": string,
    "scientificName": string,
    "category": string (fungal/bacterial/viral/pest/nutritional/environmental),
    "severity": string (mild/moderate/severe/critical),
    "confidence": number (0-1)
  },
  "alternativeDiagnoses": [
    {
      "name": string,
      "scientificName": string,
      "confidence": number (0-1),
      "category": string
    }
  ]
}

IMPORTANT INSTRUCTIONS:
- Analyze the VISUAL appearance of the plant in the image
- Look for discoloration, spots, wilting, pests, mold, or other abnormalities
- If the plant appears healthy, set diseaseDetected to false and primaryDisease to null
- Output ONLY valid JSON, nothing else
- No preamble, no explanation, no code blocks, no markdown
- Start with { and end with }
- All confidence values must be between 0 and 1`;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text().trim();

    // Remove any markdown code blocks if present
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        text = match[1].trim();
      }
    }

    // Find the first { and last } to extract JSON
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(text);

    // Basic validation
    if (typeof parsed.diseaseDetected !== 'boolean' || typeof parsed.healthyProbability !== 'number') {
      throw new Error('Invalid response structure from AI model');
    }

    // Normalize confidence values
    if (typeof parsed.confidence === 'number') {
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    }
    if (parsed.primaryDisease && typeof parsed.primaryDisease.confidence === 'number') {
      parsed.primaryDisease.confidence = Math.max(0, Math.min(1, parsed.primaryDisease.confidence));
    }

    return parsed;
  } catch (err) {
    console.error('identifyPlantDiseaseFromImage error:', err);
    throw err;
  }
}

/**
 * Call the model and request a structured JSON response describing detected diseases.
 * This avoids returning any mocked/fake data and enforces the model to return a strict schema.
 * @deprecated Use identifyPlantDiseaseFromImage for image-based analysis
 */
export async function identifyPlantDiseaseStructured(symptoms: string, imageDescription?: string): Promise<any> {
  if (!model) throw new Error('AI service unavailable');

  // Prompt instructing the model to return JSON in a strict format
  let prompt = `You are an expert plant pathologist. Analyze the following symptoms and optional image description, and return a JSON object in the EXACT format specified below.

Input symptoms: ${symptoms}
`;
  if (imageDescription) prompt += `Input image description: ${imageDescription}\n`;

  prompt += `

REQUIRED JSON OUTPUT FORMAT:
{
  "diseaseDetected": boolean,
  "confidence": number (0-1),
  "healthyProbability": number (0-1),
  "primaryDisease": {
    "name": string,
    "scientificName": string,
    "category": string (fungal/bacterial/viral/pest/nutritional/environmental),
    "severity": string (mild/moderate/severe/critical),
    "confidence": number (0-1)
  },
  "alternativeDiagnoses": [
    {
      "name": string,
      "scientificName": string,
      "confidence": number (0-1),
      "category": string
    }
  ]
}

IMPORTANT INSTRUCTIONS:
- If no disease is detected, set diseaseDetected to false and primaryDisease to null
- Output ONLY valid JSON, nothing else
- No preamble, no explanation, no code blocks, no markdown
- Start with { and end with }
- All confidence values must be between 0 and 1`;


  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove any markdown code blocks if present
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        text = match[1].trim();
      }
    }

    // Find the first { and last } to extract JSON
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(text);

    // Basic validation of expected fields
    if (typeof parsed.diseaseDetected !== 'boolean' || typeof parsed.healthyProbability !== 'number') {
      throw new Error('Invalid response structure from AI model');
    }

    // Normalize numeric confidence bounds
    if (typeof parsed.confidence === 'number') {
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    }
    if (parsed.primaryDisease && typeof parsed.primaryDisease.confidence === 'number') {
      parsed.primaryDisease.confidence = Math.max(0, Math.min(1, parsed.primaryDisease.confidence));
    }

    return parsed;
  } catch (err) {
    console.error('identifyPlantDiseaseStructured error:', err);
    // Bubble up so callers can decide how to handle absence of AI result
    throw err;
  }
}

export async function generateCareSchedule(plantName: string, environment: string): Promise<string> {
  if (!model) return unavailable;
  const prompt = `Create a detailed care schedule for a ${plantName} in a ${environment} environment. Include watering, fertilizing, pruning, and other maintenance tasks.`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, I couldn't generate a care schedule at the moment.";
  }
}

export async function chatWithGardener(message: string, context?: string): Promise<string> {
  if (!model) return unavailable;
  const prompt = context
    ? `As an expert gardener, respond to this message: "${message}" with this context: ${context}`
    : `As an expert gardener, respond to this message: "${message}"`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, I couldn't respond at the moment.";
  }
}

export async function generateNotificationContent(type: string, data: any): Promise<string> {
  if (!model) return `Notification: ${type}`;
  const prompt = `Generate a friendly notification message for type "${type}" with this data: ${JSON.stringify(data)}`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return `Notification: ${type}`;
  }
}

export async function generatePlantCareAdvice(content: string, context: { plantId?: string; careType?: string; chatHistory?: any[] }): Promise<{ text: string; suggestions?: string[]; confidence?: number; tokens?: number }> {
  if (!model) return { text: unavailable };
  let prompt = `As an expert gardener, provide helpful advice for: ${content}`;
  if (context.plantId) prompt += `\nPlant ID: ${context.plantId}`;
  if (context.careType) prompt += `\nCare type: ${context.careType}`;
  if (context.chatHistory && context.chatHistory.length > 0) {
    prompt += `\nPrevious conversation:\n${context.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Do not fabricate confidence or token estimates. Return the model text and leave
    // optional fields undefined unless the model returns structured suggestions.
    return {
      text,
      suggestions: undefined,
      confidence: undefined,
      tokens: undefined,
    };
  } catch (err) {
    console.error("Gemini API error:", err);
    return {
      text: "Sorry, I couldn't generate care advice at the moment.",
      suggestions: [],
      confidence: 0,
      tokens: 0,
    };
  }
}

/**
 * Validate if an image contains ONLY agricultural/plant content
 * STRICT VALIDATION: Rejects all non-plant images (cars, people, buildings, objects, etc.)
 * Only accepts: plants, trees, crops, gardens, farms, agricultural scenes
 * @param imageUrl - URL of the image to validate
 * @returns Promise<{isValid: boolean, confidence: number, category: string, message: string}>
 */
/**
 * Get AI-powered plant care recommendations including watering frequency and optimal care times
 * @param plantName - Name of the plant (e.g., "Sunflower", "Rose")
 * @param plantCategory - Category (Indoor, Outdoor, Succulent, etc.)
 * @returns Structured care recommendations
 */
export async function getPlantCareRecommendations(plantName: string, plantCategory?: string): Promise<{
  wateringFrequencyDays: number;
  optimalWateringTime: string;
  fertilizerFrequencyWeeks: number;
  sunlightRequirement: string;
  soilType: string;
  careTips: string[];
  seasonalAdjustments?: string;
}> {
  if (!model) throw new Error('AI service unavailable');

  const prompt = `You are an expert horticulturist. Provide care recommendations for a ${plantName}${plantCategory ? ` (${plantCategory})` : ''}.

REQUIRED JSON OUTPUT FORMAT:
{
  "wateringFrequencyDays": number (how many days between watering, typical range 1-14),
  "optimalWateringTime": string (best time of day, e.g., "Early morning (6-8 AM)" or "Evening (6-8 PM)"),
  "fertilizerFrequencyWeeks": number (how many weeks between fertilizing, typical range 2-8),
  "sunlightRequirement": string (e.g., "Full Sun (6-8 hours)", "Partial Shade (3-6 hours)", "Indirect Light"),
  "soilType": string (e.g., "Well-draining potting mix", "Loamy soil with good drainage"),
  "careTips": [array of 2-4 SIMPLE, user-friendly care tips that ANYONE can understand - use everyday language, avoid technical jargon],
  "seasonalAdjustments": string (brief note about seasonal care changes in simple terms)
}

IMPORTANT GUIDELINES FOR careTips:
- Write tips for complete beginners who know nothing about plants
- Use simple, conversational language (e.g., "Water when soil feels dry" not "Maintain consistent soil moisture levels")
- Be specific and actionable (e.g., "Place near a sunny window" not "Requires adequate photosynthetically active radiation")
- Avoid technical terms like "well-draining substrate", "foliar", "photosynthetic", etc.
- Each tip should be one short, clear sentence
- Focus on practical, easy-to-follow advice
- Examples: "Check soil with your finger before watering", "Wipe leaves gently with a damp cloth", "Keep away from cold drafts"

Base recommendations on REAL horticultural data for ${plantName}. Output ONLY valid JSON, no markdown, no code blocks. Start with { and end with }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        text = match[1].trim();
      }
    }

    // Extract JSON
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(text);

    // Validate and normalize
    return {
      wateringFrequencyDays: Math.max(1, Math.min(30, parsed.wateringFrequencyDays || 7)),
      optimalWateringTime: parsed.optimalWateringTime || 'Early morning (6-8 AM)',
      fertilizerFrequencyWeeks: Math.max(1, Math.min(12, parsed.fertilizerFrequencyWeeks || 4)),
      sunlightRequirement: parsed.sunlightRequirement || 'Full Sun',
      soilType: parsed.soilType || 'Well-draining soil',
      careTips: Array.isArray(parsed.careTips) ? parsed.careTips : [],
      seasonalAdjustments: parsed.seasonalAdjustments || undefined,
    };
  } catch (err) {
    console.error('getPlantCareRecommendations error:', err);
    throw err;
  }
}

export async function validateAgriculturalImage(imageUrl: string): Promise<{
  isValid: boolean;
  confidence: number;
  category: string;
  message: string;
}> {
  try {
    // Use Gemini Vision model for image analysis
    const visionModel = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

    if (!visionModel) {
      return {
        isValid: false,
        confidence: 0,
        category: 'service_unavailable',
        message: 'Image validation service is currently unavailable'
      };
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return {
        isValid: false,
        confidence: 0,
        category: 'fetch_error',
        message: 'Unable to access the image URL'
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = new Uint8Array(imageBuffer);

    // Determine MIME type from URL or response
    const mimeType = imageResponse.headers.get('content-type') ||
                    (imageUrl.toLowerCase().includes('.png') ? 'image/png' :
                     imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
                     imageUrl.toLowerCase().includes('.webp') ? 'image/webp' : 'image/jpeg');

    const imagePart = {
      inlineData: {
        data: Buffer.from(imageData).toString('base64'),
        mimeType: mimeType
      }
    };

    const prompt = `Analyze this image and determine if it contains ONLY plants, trees, crops, or agricultural content.

IMPORTANT: This image should be STRICTLY related to plants/agriculture. Reject images that contain:
- People, animals, or pets
- Cars, vehicles, or machinery (unless agricultural machinery)
- Buildings, houses, or urban scenes
- Objects, furniture, or man-made items
- Landscapes without clear plant content
- Food items that are not fresh produce/plants

Accept ONLY images that show:
- Individual plants, flowers, or trees
- Gardens, farms, or agricultural fields
- Crops, vegetables, or fruits on plants
- Plant diseases, pests, or growth issues
- Agricultural equipment in plant context

Respond with a JSON object in this exact format:
{
  "isValid": boolean (true ONLY if image contains plants/trees/agricultural content as the main subject, false for everything else),
  "confidence": number (0-1, how confident you are in the classification),
  "category": string (one of: "plant", "tree", "crop", "agricultural", "farm", "garden", "invalid"),
  "message": string (brief explanation of your analysis - be specific about what was detected)
}

Only respond with the JSON object, no additional text.`;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text().trim();

    // Remove any markdown code blocks if present
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        text = match[1].trim();
      }
    }

    // Find the first { and last } to extract JSON
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }

    try {
      // Parse the JSON response
      const parsed = JSON.parse(text);

      // Validate the response structure
      if (typeof parsed.isValid !== 'boolean' ||
          typeof parsed.confidence !== 'number' ||
          typeof parsed.category !== 'string' ||
          typeof parsed.message !== 'string') {
        throw new Error('Invalid response structure');
      }

      // Additional validation: ensure confidence is reasonable
      if (parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = 0.5; // Default confidence
      }

      return {
        isValid: parsed.isValid,
        confidence: parsed.confidence,
        category: parsed.category,
        message: parsed.message
      };

    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      // Fallback: assume valid if we can't parse (better to allow than block)
      return {
        isValid: true,
        confidence: 0.5,
        category: 'unknown',
        message: 'Image validation completed but response unclear - proceeding with caution'
      };
    }

  } catch (error) {
    console.error('Image validation error:', error);
    // On error, allow the image to proceed (fail-open approach)
    return {
      isValid: true,
      confidence: 0.3,
      category: 'error_fallback',
      message: 'Image validation failed - proceeding with analysis'
    };
  }
}
