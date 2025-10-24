import cron from 'node-cron';
import { ReminderNotificationService } from './reminderNotificationService';
import { logger } from '../config/logger';

/**
 * Scheduler service for running periodic background tasks
 */
export class Scheduler {
  private static tasks: cron.ScheduledTask[] = [];

  /**
   * Start all scheduled tasks
   */
  static startAll(): void {
    logger.info('🕐 Starting scheduler...');

    // Check for upcoming reminders every 15 minutes
    const reminderTask = cron.schedule('*/15 * * * *', async () => {
      logger.info('⏰ Running reminder notification job...');
      try {
        await ReminderNotificationService.checkAndNotifyUpcomingReminders();
      } catch (error) {
        logger.error('Error in reminder notification job:', error);
      }
    });

    this.tasks.push(reminderTask);
    logger.info('✅ Reminder notification scheduler started (runs every 15 minutes)');

    // Optional: Clear notification cache daily at midnight
    const cleanupTask = cron.schedule('0 0 * * *', () => {
      logger.info('🧹 Running daily cleanup...');
      ReminderNotificationService.clearNotifiedCache();
    });

    this.tasks.push(cleanupTask);
    logger.info('✅ Daily cleanup scheduler started (runs at midnight)');
  }

  /**
   * Stop all scheduled tasks
   */
  static stopAll(): void {
    logger.info('Stopping all scheduled tasks...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    logger.info('All scheduled tasks stopped');
  }

  /**
   * Get status of all scheduled tasks
   */
  static getStatus(): { totalTasks: number; runningTasks: number } {
    const runningTasks = this.tasks.filter(task => task !== null).length;
    return {
      totalTasks: this.tasks.length,
      runningTasks
    };
  }

  /**
   * Run reminder check immediately (for testing)
   */
  static async runReminderCheckNow(): Promise<void> {
    logger.info('🔔 Running immediate reminder check...');
    await ReminderNotificationService.checkAndNotifyUpcomingReminders();
  }
}
