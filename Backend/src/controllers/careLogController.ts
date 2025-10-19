import { Request, Response, NextFunction } from 'express';

export class CareLogController {
  static async createCareLog(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async getCareLogs(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async getCareLogById(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async updateCareLog(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async deleteCareLog(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async getCareLogStats(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async bulkOperation(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }

  static async getCareRecommendations(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ success: false, message: 'Care logs are not available in this deployment.' });
  }
}
