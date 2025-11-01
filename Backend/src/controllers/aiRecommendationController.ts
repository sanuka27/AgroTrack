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
}

export default AIRecommendationController;
