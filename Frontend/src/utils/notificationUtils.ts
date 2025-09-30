import { Reminder, ReminderPreferences } from '@/types/reminders';

/**
 * Check if browser notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    console.warn('Browser notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Show a browser notification for a reminder
 */
export const showReminderNotification = (reminder: Reminder): void => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const options: NotificationOptions = {
    body: reminder.description,
    icon: '/favicon.ico', // You can customize this
    badge: '/favicon.ico',
    tag: `reminder-${reminder.id}`, // Prevents duplicate notifications
    requireInteraction: reminder.priority === 'urgent', // Keep urgent notifications visible
    silent: false,
    data: {
      reminderId: reminder.id,
      plantId: reminder.plantId,
      type: reminder.type
    }
  };

  // Add actions for urgent reminders (Note: actions may not be supported in all browsers)
  if (reminder.priority === 'urgent') {
    try {
      (options as NotificationOptions & { actions?: Array<{ action: string; title: string }> }).actions = [
        {
          action: 'complete',
          title: 'Mark Complete'
        },
        {
          action: 'snooze',
          title: 'Snooze 1 Day'
        }
      ];
    } catch (error) {
      // Actions not supported in this browser
    }
  }

  const notification = new Notification(reminder.title, options);

  // Auto-close non-urgent notifications after 5 seconds
  if (reminder.priority !== 'urgent') {
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // Handle notification clicks
  notification.onclick = () => {
    // Focus the window/tab
    window.focus();

    // You could navigate to the specific plant or reminder page here
    // For now, just close the notification
    notification.close();

    // Dispatch a custom event that the app can listen to
    window.dispatchEvent(new CustomEvent('reminder-notification-clicked', {
      detail: { reminderId: reminder.id, plantId: reminder.plantId }
    }));
  };

  // Handle notification actions (for urgent reminders)
  notification.onclose = (event: Event & { action?: string }) => {
    if (event.action === 'complete') {
      window.dispatchEvent(new CustomEvent('reminder-mark-complete', {
        detail: { reminderId: reminder.id }
      }));
    } else if (event.action === 'snooze') {
      window.dispatchEvent(new CustomEvent('reminder-snooze', {
        detail: { reminderId: reminder.id, days: 1 }
      }));
    }
  };
};

/**
 * Show a test notification to verify functionality
 */
export const showTestNotification = (): void => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const notification = new Notification('AgroTrack Reminder Test', {
    body: 'This is a test notification to verify your reminder settings are working.',
    icon: '/favicon.ico',
    tag: 'test-notification'
  });

  setTimeout(() => {
    notification.close();
  }, 3000);
};

/**
 * Schedule a reminder notification
 */
export const scheduleReminderNotification = (reminder: Reminder, delayMs: number = 0): void => {
  if (delayMs > 0) {
    setTimeout(() => {
      showReminderNotification(reminder);
    }, delayMs);
  } else {
    showReminderNotification(reminder);
  }
};

/**
 * Check if it's appropriate to show notifications (not during quiet hours)
 */
export const shouldShowNotification = (reminder: Reminder, preferences: ReminderPreferences): boolean => {
  // Always show urgent reminders
  if (reminder.priority === 'urgent') return true;

  // Check quiet hours
  if (preferences.quietHours?.enabled) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const { start, end } = preferences.quietHours;

    if (start < end) {
      // Same day range
      if (currentTime >= start && currentTime <= end) return false;
    } else {
      // Overnight range
      if (currentTime >= start || currentTime <= end) return false;
    }
  }

  return true;
};

/**
 * Initialize notification system
 * Call this when the app starts to request permissions
 */
export const initializeNotifications = async (): Promise<void> => {
  if (!isNotificationSupported()) {
    console.log('Browser notifications not supported');
    return;
  }

  // Check if we already have permission
  if (getNotificationPermission() === 'default') {
    // Ask for permission
    await requestNotificationPermission();
  }

  // Listen for notification events
  if ('serviceWorker' in navigator) {
    // For PWA push notifications (future enhancement)
    navigator.serviceWorker.ready.then(registration => {
      console.log('Service worker ready for notifications');
    });
  }
};