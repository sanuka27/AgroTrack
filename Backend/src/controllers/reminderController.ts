import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reminder } from '../models/Reminder';
import { Plant } from '../models/Plant';
import { createNotificationNow } from './notificationController';

export class ReminderController {
  // Create a reminder
  static async createReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { title, dueAt, notes, plantId } = req.body;

      // If a plantId was provided, ensure it belongs to the authenticated user
      if (plantId) {
        const plantExists = await Plant.findOne({ _id: plantId, userId });
        if (!plantExists) {
          return void res.status(403).json({ success: false, message: 'Invalid plantId or you do not own this plant' });
        }
      }

      const reminder = new Reminder({
        userId,
        title,
        dueAt: new Date(dueAt),
        notes: notes || undefined,
        plantId: plantId ? new mongoose.Types.ObjectId(plantId) : null,
        completed: false,
      });
      await reminder.save();

      // Create an in-app notification for this reminder
      try {
        await createNotificationNow({
          userId,
          type: 'reminder',
          title: `Reminder: ${title}`,
          message: `You have a reminder: ${title} scheduled at ${new Date(dueAt).toLocaleString()}`,
          data: { reminderId: reminder._id }
        });
      } catch (err) {
        // Non-fatal: log and continue
        console.warn('Failed to create notification for reminder:', err);
      }

      res.status(201).json({ success: true, data: { reminder } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create reminder' });
    }
  }

  // List reminders (optionally filter)
  static async getReminders(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { status, plantId, upcoming, overdue } = req.query as any;
      const daysParam = req.query?.days as string | undefined;
      const windowDays = daysParam != null ? Number(daysParam) : undefined;

      const filter: any = { userId };
      if (plantId) filter.plantId = new mongoose.Types.ObjectId(plantId);
      if (status === 'pending') filter.completed = false;
      if (status === 'completed') filter.completed = true;
      if (upcoming === 'true') {
        const now = new Date();
        const due: any = { $gte: now };
        if (Number.isFinite(windowDays)) {
          due.$lte = new Date(now.getTime() + (windowDays as number) * 24 * 60 * 60 * 1000);
        }
        filter.dueAt = { ...(filter.dueAt || {}), ...due };
      }
      if (overdue === 'true') {
        filter.dueAt = { ...(filter.dueAt || {}), $lt: new Date() };
      }

      const reminders = await Reminder.find(filter).sort({ dueAt: 1 }).lean();
      res.json({ success: true, data: { reminders } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get reminders' });
    }
  }

  // Get by ID
  static async getReminderById(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { reminderId } = req.params;
      const reminder = await Reminder.findOne({ _id: reminderId, userId });
      if (!reminder) return void res.status(404).json({ success: false, message: 'Reminder not found' });
      res.json({ success: true, data: { reminder } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get reminder' });
    }
  }

  // Update (partial)
  static async updateReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { reminderId } = req.params;
  const { title, dueAt, notes, plantId } = req.body;
      const update: any = {};
      if (title != null) update.title = title;
      if (dueAt != null) update.dueAt = new Date(dueAt);
      if (notes != null) update.notes = notes;

      // If plantId is being changed/added, ensure ownership
      if (plantId) {
        const plantExists = await Plant.findOne({ _id: plantId, userId });
        if (!plantExists) {
          return void res.status(403).json({ success: false, message: 'Invalid plantId or you do not own this plant' });
        }
        update.plantId = plantId ? new mongoose.Types.ObjectId(plantId) : null;
      }

      const reminder = await Reminder.findOneAndUpdate(
        { _id: reminderId, userId },
        { $set: update },
        { new: true }
      );
      if (!reminder) return void res.status(404).json({ success: false, message: 'Reminder not found' });
      res.json({ success: true, data: { reminder } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update reminder' });
    }
  }

  // Delete
  static async deleteReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { reminderId } = req.params;
      const result = await Reminder.deleteOne({ _id: reminderId, userId });
      if (result.deletedCount === 0) return void res.status(404).json({ success: false, message: 'Reminder not found' });
      res.json({ success: true, message: 'Reminder deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete reminder' });
    }
  }

  // Complete
  static async completeReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { reminderId } = req.params;
      const reminder = await Reminder.findOneAndUpdate(
        { _id: reminderId, userId },
        { $set: { completed: true, completedAt: new Date() } },
        { new: true }
      );
      if (!reminder) return void res.status(404).json({ success: false, message: 'Reminder not found' });
      res.json({ success: true, data: { reminder } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to complete reminder' });
    }
  }

  // Optional: simple snooze by hours
  static async snoozeReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { reminderId } = req.params;
      const { hours = 24 } = req.body;
      const reminder = await Reminder.findOneAndUpdate(
        { _id: reminderId, userId },
        { $set: { dueAt: new Date(Date.now() + Number(hours) * 60 * 60 * 1000), completed: false, completedAt: null } },
        { new: true }
      );
      if (!reminder) return void res.status(404).json({ success: false, message: 'Reminder not found' });
      res.json({ success: true, data: { reminder } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to snooze reminder' });
    }
  }

  // Upcoming (next N days)
  static async getUpcomingReminders(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const days = Number((req.query?.days as string) || 7);
      const now = new Date();
      const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const reminders = await Reminder.find({ userId, completed: false, dueAt: { $gte: now, $lte: end } }).sort({ dueAt: 1 }).lean();
      res.json({ success: true, data: { reminders } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get upcoming reminders' });
    }
  }

  // Maintenance: auto-complete or remove overdue reminders
  static async cleanupOverdueReminders(): Promise<{ removed: number }> {
    const now = new Date();
    // Delete reminders that are overdue and marked completed (safety): none expected
    const res = await Reminder.deleteMany({ completed: false, dueAt: { $lt: now } });
    return { removed: (res as any).deletedCount || 0 };
  }

  // Keep API surface: no-op simplified endpoints
  static async generateSmartSchedule(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Smart schedule not available in simplified reminders.' });
  }
  static async bulkOperation(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Bulk operations not available in simplified reminders.' });
  }
}
