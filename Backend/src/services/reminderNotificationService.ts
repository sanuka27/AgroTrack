import * as admin from 'firebase-admin';
import mongoose from 'mongoose';
import { Reminder } from '../models/Reminder';
import { User } from '../models/User';
import { createNotificationNow } from '../controllers/notificationController';
import { logger } from '../config/logger';

/**
 * Service to send notifications for upcoming reminders
 * Checks for reminders due within the next 1 hour and sends notifications
 */
export class ReminderNotificationService {
  private static notifiedReminders = new Set<string>(); // Track already notified reminders

  /**
   * Find reminders that are due in the next hour and haven't been notified yet
   */
  static async findUpcomingReminders(): Promise<any[]> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer

      // Find reminders that:
      // 1. Are not completed
      // 2. Are due between 5 minutes and 65 minutes from now (to catch the 1-hour window)
      const reminders = await Reminder.find({
        completed: false,
        dueAt: {
          $gte: fiveMinutesFromNow,
          $lte: oneHourFromNow
        }
      })
      .populate('userId', 'fcmToken name email preferences')
      .populate('plantId', 'name')
      .lean();

      // Filter out already notified reminders
      const newReminders = reminders.filter(reminder => 
        !this.notifiedReminders.has(reminder._id.toString())
      );

      return newReminders;
    } catch (error) {
      logger.error('Error finding upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Send Firebase push notification for a reminder
   */
  static async sendPushNotification(
    fcmToken: string, 
    title: string, 
    body: string, 
    data?: any
  ): Promise<boolean> {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'reminders',
            priority: 'high' as const,
            sound: 'default',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`Push notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Format the notification message for a reminder
   */
  static formatReminderMessage(reminder: any): { title: string; body: string } {
    const dueDate = new Date(reminder.dueAt);
    const timeString = dueDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const plantName = reminder.plantId?.name || 'your plant';
    
    return {
      title: `⏰ Reminder in 1 Hour`,
      body: `${reminder.title} for ${plantName} at ${timeString}`
    };
  }

  /**
   * Process a single reminder and send notifications
   */
  static async processReminder(reminder: any): Promise<void> {
    try {
      const user = reminder.userId;
      
      if (!user) {
        logger.warn(`User not found for reminder ${reminder._id}`);
        return;
      }

      // Check if user has push notifications enabled
      const pushEnabled = user.preferences?.notifications?.push !== false;
      
      if (!pushEnabled) {
        logger.info(`Push notifications disabled for user ${user._id}`);
        return;
      }

      const { title, body } = this.formatReminderMessage(reminder);
      
      // Send Firebase push notification if user has FCM token
      if (user.fcmToken) {
        const data = {
          reminderId: reminder._id.toString(),
          type: 'reminder',
          dueAt: reminder.dueAt.toISOString(),
          plantId: reminder.plantId?._id?.toString() || '',
        };
        
        const sent = await this.sendPushNotification(user.fcmToken, title, body, data);
        
        if (sent) {
          logger.info(`Reminder notification sent to user ${user._id} for reminder ${reminder._id}`);
        }
      } else {
        logger.info(`No FCM token for user ${user._id}, skipping push notification`);
      }

      // Create in-app notification
      try {
        await createNotificationNow({
          userId: new mongoose.Types.ObjectId(user._id),
          type: 'reminder',
          title,
          message: body,
          data: { 
            reminderId: reminder._id,
            plantId: reminder.plantId?._id 
          }
        });
        logger.info(`In-app notification created for reminder ${reminder._id}`);
      } catch (error) {
        logger.error('Error creating in-app notification:', error);
      }

      // Mark as notified
      this.notifiedReminders.add(reminder._id.toString());
      
      // Clean up old notified reminders (keep only last 1000)
      if (this.notifiedReminders.size > 1000) {
        const toDelete = Array.from(this.notifiedReminders).slice(0, 100);
        toDelete.forEach(id => this.notifiedReminders.delete(id));
      }

    } catch (error) {
      logger.error(`Error processing reminder ${reminder._id}:`, error);
    }
  }

  /**
   * Main job function to check and send reminder notifications
   */
  static async checkAndNotifyUpcomingReminders(): Promise<void> {
    try {
      logger.info('🔔 Checking for upcoming reminders...');
      
      const upcomingReminders = await this.findUpcomingReminders();
      
      if (upcomingReminders.length === 0) {
        logger.info('No upcoming reminders found');
        return;
      }

      logger.info(`Found ${upcomingReminders.length} upcoming reminder(s) to notify`);

      // Process all reminders
      for (const reminder of upcomingReminders) {
        await this.processReminder(reminder);
      }

      logger.info('✅ Reminder notification check completed');
    } catch (error) {
      logger.error('Error in checkAndNotifyUpcomingReminders:', error);
    }
  }

  /**
   * Clear the notified reminders cache
   */
  static clearNotifiedCache(): void {
    this.notifiedReminders.clear();
    logger.info('Notified reminders cache cleared');
  }

  /**
   * Manual trigger for testing purposes
   */
  static async testNotification(userId: string, reminderId: string): Promise<void> {
    try {
      const reminder = await Reminder.findById(reminderId)
        .populate('userId', 'fcmToken name email preferences')
        .populate('plantId', 'name');

      if (!reminder) {
        throw new Error('Reminder not found');
      }

      if (reminder.userId._id.toString() !== userId) {
        throw new Error('Reminder does not belong to user');
      }

      await this.processReminder(reminder);
      logger.info(`Test notification sent for reminder ${reminderId}`);
    } catch (error) {
      logger.error('Error sending test notification:', error);
      throw error;
    }
  }
}
