import { Request, Response, NextFunction } from 'express';

export class ReminderController {
  static async createReminder(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async getReminders(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async getReminderById(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async updateReminder(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async deleteReminder(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async completeReminder(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async snoozeReminder(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async getUpcomingReminders(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async generateSmartSchedule(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
  static async bulkOperation(_req: Request, res: Response, _next: NextFunction): Promise<void> { res.status(501).json({ success: false, message: 'Reminders are not available in this deployment.' }); }
}
