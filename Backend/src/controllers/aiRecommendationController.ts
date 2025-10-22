import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AIRecommendation, IAIRecommendation } from '../models/AIRecommendation';

export class AIRecommendationController {
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
