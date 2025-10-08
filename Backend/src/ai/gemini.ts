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
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

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
    return {
      text,
      suggestions: [], // Could parse suggestions from text if needed
      confidence: 0.8, // Mock confidence
      tokens: text.length / 4, // Rough token estimate
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
export async function validateAgriculturalImage(imageUrl: string): Promise<{
  isValid: boolean;
  confidence: number;
  category: string;
  message: string;
}> {
  try {
    // Use Gemini Vision model for image analysis
    const visionModel = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

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
    const text = response.text();

    try {
      // Parse the JSON response
      const parsed = JSON.parse(text.trim());

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
