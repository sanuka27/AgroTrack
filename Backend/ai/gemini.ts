// backend/ai/gemini.ts
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize Gemini with your API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Get the text model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Function to generate plant care tips
export async function getPlantCareTips(plantName: string, problem: string): Promise<string> {
  const prompt = `Give me detailed care tips for a ${plantName} showing signs of ${problem}. 
Include causes, solutions, and prevention tips.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, I couldn't generate care tips at the moment.";
  }
}

// Function to generate notification content
export async function generateNotificationContent(
  type: 'reminder' | 'alert' | 'tip',
  context: Record<string, any>
): Promise<string> {
  let prompt = '';
  
  switch (type) {
    case 'reminder':
      prompt = `Generate a friendly plant care reminder message for ${context.plantName}. The task is ${context.task}. Keep it encouraging and under 100 characters.`;
      break;
    case 'alert':
      prompt = `Generate an urgent but helpful alert message about ${context.issue} for ${context.plantName}. Include a quick action tip. Keep it under 120 characters.`;
      break;
    case 'tip':
      prompt = `Generate a helpful plant care tip for ${context.plantName} owners. Make it seasonal and practical. Keep it under 150 characters.`;
      break;
    default:
      return 'Plant care notification';
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return `Plant care ${type}`;
  }
}

// Function to analyze plant health from description
export async function analyzePlantHealth(
  plantName: string,
  symptoms: string,
  environment: Record<string, any>
): Promise<{
  diagnosis: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}> {
  const prompt = `Analyze the health of a ${plantName} with these symptoms: ${symptoms}. 
Environment details: ${JSON.stringify(environment)}. 
Provide a diagnosis, severity level (low/medium/high), and 3-5 specific recommendations.
Format as JSON with keys: diagnosis, severity, recommendations (array).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const analysis = JSON.parse(text);
      return {
        diagnosis: analysis.diagnosis || 'Unable to determine diagnosis',
        severity: ['low', 'medium', 'high'].includes(analysis.severity) ? analysis.severity : 'medium',
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : ['Monitor plant closely']
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        diagnosis: text.slice(0, 200),
        severity: 'medium',
        recommendations: ['Monitor plant health', 'Ensure proper watering', 'Check light conditions']
      };
    }
  } catch (err) {
    console.error("Gemini API error:", err);
    return {
      diagnosis: 'Unable to analyze plant health at this time',
      severity: 'medium',
      recommendations: ['Monitor plant closely', 'Ensure basic care needs are met']
    };
  }
}
