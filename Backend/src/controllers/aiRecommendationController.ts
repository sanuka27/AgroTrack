import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AIRecommendation, IAIRecommendation } from '../models/AIRecommendation';
import { getPlantCareRecommendations } from '../ai/gemini';

export class AIRecommendationController {
  /**
   * Get AI-powered plant care recommendations
   * POST /api/ai/plant-care-recommendations
   * Body: { plantName: string, plantCategory?: string }
   */
  static async getPlantCareRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { plantName, plantCategory } = req.body;

      if (!plantName) {
        return void res.status(400).json({ 
          success: false, 
          message: 'plantName is required' 
        });
      }

      const recommendations = await getPlantCareRecommendations(plantName, plantCategory);

      res.json({ 
        success: true, 
        data: recommendations 
      });
    } catch (err) {
      console.error('Failed to get plant care recommendations', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get AI recommendations. Please try again.' 
      });
    }
  }
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user ? new mongoose.Types.ObjectId((req as any).user._id) : null;
      const { plantId, limit = '5' } = req.query as any;

      const q: any = {};
      if (userId) q.userId = userId;
      if (plantId) q.plantId = new mongoose.Types.ObjectId(plantId);

      const l = Math.min(parseInt(limit, 10) || 5, 50);

  const recs = await (AIRecommendation as mongoose.Model<IAIRecommendation>).find(q).sort({ createdAt: -1 }).limit(l).lean();
      res.json({ success: true, data: { recommendations: recs } });
    } catch (err) {
      console.error('Failed to fetch AI recommendations', err);
      res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
    }
  }

  /**
   * Get a single AI recommendation by ID
   * GET /api/ai-recommendations/:id
   */
  static async getRecommendationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user ? new mongoose.Types.ObjectId((req as any).user._id) : null;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return void res.status(400).json({
          success: false,
          message: 'Invalid recommendation ID'
        });
      }

      const q: any = { _id: new mongoose.Types.ObjectId(id) };
      if (userId) q.userId = userId;

      const rec = await (AIRecommendation as mongoose.Model<IAIRecommendation>).findOne(q).lean();

      if (!rec) {
        return void res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        });
      }

      res.json({ success: true, data: rec });
    } catch (err) {
      console.error('Failed to fetch AI recommendation', err);
      res.status(500).json({ success: false, message: 'Failed to fetch recommendation' });
    }
  }

  /**
   * Save AI analysis results to history
   * POST /api/ai-recommendations/save
   * Body: { plantName, imageUrl, description, analysisData }
   */
  static async saveAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user ? new mongoose.Types.ObjectId((req as any).user._id) : null;
      const { plantName, plantId, imageUrl, description, analysisData } = req.body;

      if (!plantName || !imageUrl || !analysisData) {
        return void res.status(400).json({
          success: false,
          message: 'plantName, imageUrl, and analysisData are required'
        });
      }

      // Convert the analysis data from the frontend format to our model format
      const { likelyDiseases, urgency, careSteps, prevention } = analysisData;

      // Determine the primary disease
      const primaryDiseaseObj = likelyDiseases && likelyDiseases.length > 0 ? likelyDiseases[0] : null;
      const severityMap: { [key: string]: 'mild' | 'moderate' | 'severe' | 'critical' } = {
        low: 'mild',
        medium: 'moderate',
        high: 'severe'
      };

      const recommendation = new AIRecommendation({
        userId,
        plantId: plantId ? new mongoose.Types.ObjectId(plantId) : null,
        plantName,
        imageUrl,
        description: description || null,
        detectionResults: {
          diseaseDetected: likelyDiseases && likelyDiseases.length > 0,
          confidence: primaryDiseaseObj ? (primaryDiseaseObj.confidence === 'high' ? 90 : primaryDiseaseObj.confidence === 'medium' ? 65 : 35) : 0,
          primaryDisease: primaryDiseaseObj ? {
            name: primaryDiseaseObj.name,
            category: primaryDiseaseObj.why || 'fungal',
            severity: severityMap[urgency] || 'moderate',
            confidence: primaryDiseaseObj.confidence === 'high' ? 90 : primaryDiseaseObj.confidence === 'medium' ? 65 : 35
          } : undefined,
          alternativeDiagnoses: likelyDiseases?.slice(1).map((d: any) => ({
            name: d.name,
            confidence: d.confidence === 'high' ? 90 : d.confidence === 'medium' ? 65 : 35,
            category: d.why || 'unknown'
          })) || []
        },
        recommendations: {
          immediateActions: careSteps || [],
          treatments: [],
          preventionMeasures: prevention || [],
          followUpRequired: urgency === 'high' || urgency === 'medium',
          followUpDays: urgency === 'high' ? 3 : urgency === 'medium' ? 7 : 14,
          quarantineRecommended: urgency === 'high'
        },
        status: 'completed'
      });

      await recommendation.save();

      res.json({
        success: true,
        message: 'AI analysis saved successfully',
        data: { recommendation }
      });
    } catch (err) {
      console.error('Failed to save AI analysis', err);
      res.status(500).json({
        success: false,
        message: 'Failed to save AI analysis. Please try again.'
      });
    }
  }
}

export default AIRecommendationController;
