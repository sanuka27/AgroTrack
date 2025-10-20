import { Request, Response, NextFunction } from 'express';
import CareLog from '../models/CareLog';
import mongoose from 'mongoose';

export class CareLogController {
  // Methods return Response or void (when delegating to next(err))
  static async createCareLog(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const { plantId, careType, notes, photos, careData, date } = req.body;
      if (!plantId || !careType) return res.status(400).json({ success: false, message: 'plantId and careType are required' });

      const newLog = await CareLog.create({
        userId: user._id,
        plantId: new mongoose.Types.ObjectId(plantId),
        careType,
        notes,
        photos,
        careData,
        date: date ? new Date(date) : new Date()
      });

      res.status(201).json({ success: true, careLog: newLog });
    } catch (error) {
      next(error);
    }
  }

  static async getCareLogs(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const { plantId, limit = 20, page = 1 } = req.query as any;
      const q: any = { userId: user._id };
      if (plantId) q.plantId = plantId;

      const l = Math.min(parseInt(limit, 10) || 20, 200);
      const p = Math.max(parseInt(page, 10) || 1, 1);

      const careLogs = await CareLog.find(q)
        .sort({ date: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean();

      const total = await CareLog.countDocuments(q);

      res.status(200).json({ careLogs, total, page: p, limit: l });
    } catch (error) {
      next(error);
    }
  }

  static async getCareLogById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const id = req.params.careLogId;
      if (!id) return res.status(400).json({ success: false, message: 'careLogId is required' });

      const careLog = await CareLog.findOne({ _id: id, userId: user._id }).lean();
      if (!careLog) return res.status(404).json({ success: false, message: 'Care log not found' });

      res.status(200).json({ careLog });
    } catch (error) {
      next(error);
    }
  }

  static async updateCareLog(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
    return res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async deleteCareLog(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
    return res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async getCareLogStats(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
    return res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async bulkOperation(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
    return res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async getCareRecommendations(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
    return res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }
}
