// Smart Reminder System Components
export { SmartReminderDashboard } from '../SmartReminderDashboard';
export { ReminderSettings } from '../ReminderSettings';

// Reminder System Types
export type {
  Reminder,
  ReminderType,
  ReminderPriority,
  ReminderStatus,
  ReminderPreferences,
  ReminderHistory,
  SmartReminderConfig
} from '../../types/reminders';

// Reminder System Utilities
export {
  generateSmartReminders,
  calculateNextDueDate,
  calculateReminderPriority,
  generateReminderDescription,
  filterRemindersForDisplay,
  getTodaysReminders,
  getOverdueReminders,
  snoozeReminder,
  completeReminder,
  getDefaultReminderPreferences,
  getCurrentSeason,
  getSeasonalMultiplier
} from '../../utils/reminderUtils';

// Notification Utilities
export {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showReminderNotification,
  showTestNotification,
  scheduleReminderNotification,
  shouldShowNotification,
  initializeNotifications
} from '../../utils/notificationUtils';