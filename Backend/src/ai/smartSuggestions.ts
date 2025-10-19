// AI Smart Suggestions Service - Analyzes plants and generates personalized care tips
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Plant, IPlant } from "../models/Plant";
import { AISmartSuggestion, SuggestionType } from "../models/AISmartSuggestion";
import mongoose from "mongoose";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

interface PlantAnalysis {
  healthScore: number;
  growthRate: number;
  needsWater: boolean;
  needsFertilizer: boolean;
  sunlightStatus: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SuggestionResult {
  type: SuggestionType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  expiresInDays?: number;
}

/**
 * Analyze plant condition and generate AI-powered care suggestions
 */
export async function analyzePlantAndGenerateSuggestions(
  userId: string,
  plantId?: string
): Promise<any[]> {
  try {
    if (!model) {
      throw new Error('AI service not available');
    }

    // Fetch plants to analyze
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (plantId) {
      query._id = new mongoose.Types.ObjectId(plantId);
    }

    const plants = await Plant.find(query).limit(20).lean();

    if (plants.length === 0) {
      return [];
    }

    const suggestions: any[] = [];

    // Analyze each plant
    for (const plant of plants) {
      const analysis = analyzePlantCondition(plant as unknown as IPlant);
      const aiSuggestions = await generateAISuggestions(plant as unknown as IPlant, analysis);

      // Save suggestions to database
      for (const suggestion of aiSuggestions) {
        const savedSuggestion = await AISmartSuggestion.create({
          userId: new mongoose.Types.ObjectId(userId),
          plantId: plant._id,
          type: suggestion.type,
          title: suggestion.title,
          message: suggestion.message,
          priority: suggestion.priority,
          confidence: suggestion.confidence,
          analysisData: {
            healthScore: analysis.healthScore,
            growthRate: analysis.growthRate,
            lastWatered: plant.lastWateredDate,
            lastFertilized: plant.lastFertilizedDate,
            sunlightExposure: plant.sunlightRequirements || plant.careInstructions?.sunlight,
          },
          aiModel: 'gemini-pro',
          tokensUsed: 0, // Will be updated if we track tokens
          expiresAt: suggestion.expiresInDays 
            ? new Date(Date.now() + suggestion.expiresInDays * 24 * 60 * 60 * 1000)
            : undefined
        });

        suggestions.push(savedSuggestion);
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error analyzing plants and generating suggestions:', error);
    throw error;
  }
}

/**
 * Analyze plant condition based on available data
 */
function analyzePlantCondition(plant: IPlant): PlantAnalysis {
  const now = new Date();
  
  // Calculate health score
  let healthScore = 75; // Default
  if (plant.healthScore) {
    healthScore = plant.healthScore;
  } else if (plant.healthStatus) {
    const healthMap: { [key: string]: number } = {
      'Excellent': 95,
      'Good': 80,
      'Fair': 60,
      'Poor': 40,
      'Critical': 20
    };
    healthScore = healthMap[plant.healthStatus] || 75;
  }

  // Calculate growth rate
  const growthRate = plant.growthRate || 0;

  // Check watering status
  const wateringDays = plant.wateringEveryDays || plant.wateringFrequency || 7;
  const daysSinceWatered = plant.lastWateredDate
    ? Math.floor((now.getTime() - new Date(plant.lastWateredDate).getTime()) / (1000 * 60 * 60 * 24))
    : wateringDays + 1;
  const needsWater = daysSinceWatered >= wateringDays;

  // Check fertilizer status
  const fertilizerWeeks = plant.fertilizerEveryWeeks || 4;
  const weeksSinceFertilized = plant.lastFertilizedDate
    ? Math.floor((now.getTime() - new Date(plant.lastFertilizedDate).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : fertilizerWeeks + 1;
  const needsFertilizer = weeksSinceFertilized >= fertilizerWeeks;

  // Assess sunlight status
  const sunlightStatus = plant.sunlightRequirements || plant.careInstructions?.sunlight || 'Unknown';

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (healthScore < 50 || daysSinceWatered > wateringDays * 1.5) {
    riskLevel = 'high';
  } else if (healthScore < 70 || needsWater) {
    riskLevel = 'medium';
  }

  return {
    healthScore,
    growthRate,
    needsWater,
    needsFertilizer,
    sunlightStatus,
    riskLevel
  };
}

/**
 * Generate AI-powered suggestions based on plant analysis
 */
async function generateAISuggestions(
  plant: IPlant,
  analysis: PlantAnalysis
): Promise<SuggestionResult[]> {
  const suggestions: SuggestionResult[] = [];

  try {
    // Build context for AI
    const context = `
Plant: ${plant.name}
Category: ${plant.category || 'Unknown'}
Age: ${plant.ageYears ? `${plant.ageYears} years` : 'Unknown'}
Health Score: ${analysis.healthScore}/100
Growth Rate: ${analysis.growthRate}% this month
Needs Water: ${analysis.needsWater ? 'Yes' : 'No'}
Needs Fertilizer: ${analysis.needsFertilizer ? 'Yes' : 'No'}
Sunlight: ${analysis.sunlightStatus}
Risk Level: ${analysis.riskLevel}
Last Watered: ${plant.lastWateredDate ? new Date(plant.lastWateredDate).toLocaleDateString() : 'Unknown'}
Watering Frequency: Every ${plant.wateringEveryDays || plant.wateringFrequency || 7} days
`.trim();

    // Generate suggestions based on conditions
    const prompts: Array<{ type: SuggestionType; prompt: string; priority: 'low' | 'medium' | 'high' | 'urgent'; condition: boolean }> = [];

    // Health warnings
    if (analysis.healthScore < 50) {
      prompts.push({
        type: 'health_warning',
        prompt: `The ${plant.name} has a low health score of ${analysis.healthScore}/100. Provide a brief, actionable alert about what might be wrong and immediate steps to take. Keep it under 100 words.`,
        priority: 'urgent',
        condition: true
      });
    }

    // Watering alerts
    if (analysis.needsWater) {
      prompts.push({
        type: 'alert',
        prompt: `The ${plant.name} needs watering. Provide a brief reminder with optimal watering technique for this plant type. Keep it under 80 words.`,
        priority: 'high',
        condition: true
      });
    }

    // Growth insights
    if (Math.abs(analysis.growthRate) > 15) {
      prompts.push({
        type: 'growth_insight',
        prompt: `The ${plant.name} is ${analysis.growthRate > 0 ? 'growing rapidly at' : 'declining at'} ${Math.abs(analysis.growthRate)}% this month. Provide insight on what this means and what actions to take. Keep it under 100 words.`,
        priority: analysis.growthRate < 0 ? 'high' : 'medium',
        condition: true
      });
    }

    // Pro tips for healthy plants
    if (analysis.healthScore >= 70 && !analysis.needsWater) {
      prompts.push({
        type: 'pro_tip',
        prompt: `The ${plant.name} is doing well. Provide an advanced care tip to optimize its growth or health further. Keep it under 80 words.`,
        priority: 'low',
        condition: true
      });
    }

    // Fertilizer reminders
    if (analysis.needsFertilizer) {
      prompts.push({
        type: 'care_reminder',
        prompt: `The ${plant.name} needs fertilizing. Provide a brief reminder with best practices for fertilizing this plant type. Keep it under 80 words.`,
        priority: 'medium',
        condition: true
      });
    }

    // Generate AI content for each prompt
    for (const { type, prompt, priority, condition } of prompts) {
      if (!condition) continue;

      try {
        const fullPrompt = `${context}\n\n${prompt}\n\nProvide ONLY the message text, no labels or extra formatting.`;
        const result = await model!.generateContent(fullPrompt);
        const response = await result.response;
        const message = response.text().trim();

        // Generate a concise title
        const titleResult = await model!.generateContent(
          `Create a 3-5 word title for this plant care message: "${message}". Respond with ONLY the title, nothing else.`
        );
        const title = titleResult.response.text().trim().replace(/['"]/g, '');

        suggestions.push({
          type,
          title,
          message,
          priority,
          confidence: 0.85,
          expiresInDays: type === 'alert' ? 1 : type === 'care_reminder' ? 3 : 7
        });

        // Limit to avoid too many API calls
        if (suggestions.length >= 2) break;
      } catch (error) {
        console.error('Error generating AI suggestion:', error);
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error in generateAISuggestions:', error);
    return [];
  }
}

/**
 * Get active suggestions for a user
 */
export async function getUserSuggestions(
  userId: string,
  options: {
    includeRead?: boolean;
    includeDismissed?: boolean;
    limit?: number;
  } = {}
): Promise<any[]> {
  const query: any = { 
    userId: new mongoose.Types.ObjectId(userId)
  };

  if (!options.includeRead) {
    query.isRead = false;
  }

  if (!options.includeDismissed) {
    query.isDismissed = false;
  }

  const suggestions = await AISmartSuggestion
    .find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(options.limit || 10)
    .populate('plantId', 'name imageUrl category')
    .lean();

  return suggestions;
}

/**
 * Mark suggestion as read
 */
export async function markSuggestionAsRead(suggestionId: string): Promise<void> {
  await AISmartSuggestion.findByIdAndUpdate(suggestionId, { isRead: true });
}

/**
 * Dismiss a suggestion
 */
export async function dismissSuggestion(suggestionId: string): Promise<void> {
  await AISmartSuggestion.findByIdAndUpdate(suggestionId, { isDismissed: true });
}

/**
 * Mark suggestion as actioned
 */
export async function actionSuggestion(suggestionId: string): Promise<void> {
  await AISmartSuggestion.findByIdAndUpdate(suggestionId, { 
    isActioned: true,
    actionedAt: new Date()
  });
}
