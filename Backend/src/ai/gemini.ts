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
