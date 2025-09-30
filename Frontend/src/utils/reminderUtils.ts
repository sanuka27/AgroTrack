import { Reminder, ReminderType, ReminderPriority, ReminderStatus, ReminderPreferences, SmartReminderConfig, ReminderHistory } from '@/types/reminders';
import { Plant } from '@/types/plant';
import { CareLog, CareType } from '@/types/care';
import { getPlantCareLogs, calculateCareFrequency } from '@/utils/careUtils';
import { addDays, isWithinInterval, startOfDay, endOfDay, format, getMonth } from 'date-fns';

// Default configuration for smart reminders
export const DEFAULT_REMINDER_CONFIG: SmartReminderConfig = {
  plantTypeDefaults: {
    'Indoor': {
      watering: 7,
      fertilizing: 14,
      pruning: 30,
      repotting: 365,
      'health-check': 30,
      'pest-treatment': 90,
      'soil-change': 180,
      'location-change': 180
    },
    'Outdoor': {
      watering: 3,
      fertilizing: 14,
      pruning: 60,
      repotting: 730,
      'health-check': 14,
      'pest-treatment': 30,
      'soil-change': 180,
      'location-change': 365
    },
    'Succulent': {
      watering: 14,
      fertilizing: 30,
      pruning: 90,
      repotting: 730,
      'health-check': 60,
      'pest-treatment': 120,
      'soil-change': 365,
      'location-change': 365
    },
    'Flower': {
      watering: 5,
      fertilizing: 7,
      pruning: 14,
      repotting: 365,
      'health-check': 7,
      'pest-treatment': 14,
      'soil-change': 90,
      'location-change': 180
    },
    'Herb': {
      watering: 3,
      fertilizing: 14,
      pruning: 30,
      repotting: 180,
      'health-check': 14,
      'pest-treatment': 30,
      'soil-change': 90,
      'location-change': 180
    },
    'Tree': {
      watering: 14,
      fertilizing: 30,
      pruning: 180,
      repotting: 1460, // 4 years
      'health-check': 90,
      'pest-treatment': 60,
      'soil-change': 730,
      'location-change': 730
    }
  },
  seasonalMultipliers: {
    winter: 1.5, // Less frequent in winter
    spring: 1.0, // Normal
    summer: 0.8, // More frequent in summer
    fall: 1.2   // Slightly less frequent in fall
  },
  priorityThresholds: {
    low: 1,
    medium: 3,
    high: 7,
    urgent: 14
  }
};

/**
 * Generate a unique reminder ID
 */
export const generateReminderId = (): string => {
  return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get current season based on month
 */
export const getCurrentSeason = (): keyof SmartReminderConfig['seasonalMultipliers'] => {
  const month = getMonth(new Date());
  if (month >= 11 || month <= 1) return 'winter'; // Dec-Feb
  if (month >= 2 && month <= 4) return 'spring'; // Mar-May
  if (month >= 5 && month <= 7) return 'summer'; // Jun-Aug
  return 'fall'; // Sep-Nov
};

/**
 * Calculate seasonal multiplier for a reminder type
 */
export const getSeasonalMultiplier = (reminderType: ReminderType, config: SmartReminderConfig = DEFAULT_REMINDER_CONFIG): number => {
  const season = getCurrentSeason();

  // Some care types are less affected by seasons
  const seasonalCareTypes: ReminderType[] = ['watering', 'fertilizing'];
  if (!seasonalCareTypes.includes(reminderType)) {
    return 1.0;
  }

  return config.seasonalMultipliers[season];
};

/**
 * Calculate next due date based on plant type, care history, and season
 */
export const calculateNextDueDate = (
  plant: Plant,
  reminderType: ReminderType,
  careLogs: CareLog[],
  config: SmartReminderConfig = DEFAULT_REMINDER_CONFIG
): Date => {
  const plantType = plant.category;
  const defaultFrequency = config.plantTypeDefaults[plantType]?.[reminderType] || 7;

  // Get historical frequency from care logs
  const historicalFrequency = calculateCareFrequency(careLogs, plant.id, reminderType as CareType);

  // Use historical frequency if available and reasonable (between 1-365 days)
  const frequency = (historicalFrequency > 0 && historicalFrequency <= 365) ? historicalFrequency : defaultFrequency;

  // Apply seasonal adjustment
  const seasonalMultiplier = getSeasonalMultiplier(reminderType, config);
  const adjustedFrequency = Math.round(frequency * seasonalMultiplier);

  // Find last care date for this type
  const lastCareLog = getPlantCareLogs(careLogs, plant.id)
    .filter(log => log.careType === reminderType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const lastCareDate = lastCareLog ? new Date(lastCareLog.date) : new Date(plant.lastWatered || Date.now());

  // Calculate next due date
  return addDays(lastCareDate, adjustedFrequency);
};

/**
 * Calculate reminder priority based on how overdue it is
 */
export const calculateReminderPriority = (
  dueDate: Date,
  config: SmartReminderConfig = DEFAULT_REMINDER_CONFIG
): ReminderPriority => {
  const now = new Date();
  const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysOverdue >= config.priorityThresholds.urgent) return 'urgent';
  if (daysOverdue >= config.priorityThresholds.high) return 'high';
  if (daysOverdue >= config.priorityThresholds.medium) return 'medium';
  return 'low';
};

/**
 * Generate smart reminders for all plants
 */
export const generateSmartReminders = (
  plants: Plant[],
  careLogs: CareLog[],
  preferences: ReminderPreferences,
  config: SmartReminderConfig = DEFAULT_REMINDER_CONFIG
): Reminder[] => {
  const reminders: Reminder[] = [];
  const now = new Date();

  plants.forEach(plant => {
    // Check if reminders are enabled for this plant
    const plantSettings = preferences.plantSpecificSettings[plant.id];
    if (plantSettings && !plantSettings.enabled) return;

    // Generate reminders for each care type
    const careTypes: ReminderType[] = ['watering', 'fertilizing', 'pruning', 'repotting', 'health-check'];

    careTypes.forEach(reminderType => {
      const nextDueDate = calculateNextDueDate(plant, reminderType, careLogs, config);
      const priority = calculateReminderPriority(nextDueDate, config);

      // Only create reminder if it's due soon or overdue
      const daysUntilDue = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue > preferences.advanceNoticeDays) return;

      // Find last care date
      const lastCareLog = getPlantCareLogs(careLogs, plant.id)
        .filter(log => log.careType === reminderType)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const reminder: Reminder = {
        id: generateReminderId(),
        plantId: plant.id,
        plantName: plant.name,
        type: reminderType,
        title: `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} ${plant.name}`,
        description: generateReminderDescription(reminderType, plant.name, daysUntilDue),
        dueDate: nextDueDate,
        priority,
        status: daysUntilDue < 0 ? 'overdue' : 'pending',
        lastCareDate: lastCareLog ? new Date(lastCareLog.date) : undefined,
        frequency: {
          days: Math.floor((nextDueDate.getTime() - (lastCareLog ? new Date(lastCareLog.date).getTime() : now.getTime())) / (1000 * 60 * 60 * 24)),
          isFlexible: true
        },
        seasonalAdjustments: {
          winterMultiplier: config.seasonalMultipliers.winter,
          summerMultiplier: config.seasonalMultipliers.summer
        },
        createdAt: now,
        updatedAt: now
      };

      reminders.push(reminder);
    });
  });

  // Sort by priority and due date
  return reminders.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
};

/**
 * Generate human-readable reminder description
 */
export const generateReminderDescription = (type: ReminderType, plantName: string, daysUntilDue: number): string => {
  const action = type.charAt(0).toUpperCase() + type.slice(1);
  const timeDescription = daysUntilDue < 0
    ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`
    : daysUntilDue === 0
    ? 'Due today'
    : daysUntilDue === 1
    ? 'Due tomorrow'
    : `Due in ${daysUntilDue} days`;

  return `${action} for ${plantName} is ${timeDescription}`;
};

/**
 * Check if current time is within quiet hours
 */
export const isWithinQuietHours = (preferences: ReminderPreferences): boolean => {
  if (!preferences.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  const { start, end } = preferences.quietHours;

  if (start < end) {
    // Same day range (e.g., 22:00 to 08:00)
    return currentTime >= start && currentTime <= end;
  } else {
    // Overnight range (e.g., 22:00 to 08:00 next day)
    return currentTime >= start || currentTime <= end;
  }
};

/**
 * Filter reminders based on user preferences and quiet hours
 */
export const filterRemindersForDisplay = (
  reminders: Reminder[],
  preferences: ReminderPreferences
): Reminder[] => {
  const isQuietTime = isWithinQuietHours(preferences);

  return reminders.filter(reminder => {
    // Don't show if quiet hours are active and this is not urgent
    if (isQuietTime && reminder.priority !== 'urgent') {
      return false;
    }

    // Check plant-specific settings
    const plantSettings = preferences.plantSpecificSettings[reminder.plantId];
    if (plantSettings && !plantSettings.enabled) {
      return false;
    }

    return true;
  });
};

/**
 * Get default reminder preferences
 */
export const getDefaultReminderPreferences = (): ReminderPreferences => ({
  enabled: true,
  notificationMethods: ['in-app'],
  advanceNoticeDays: 3,
  maxRemindersPerDay: 10,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  plantSpecificSettings: {}
});

/**
 * Snooze a reminder
 */
export const snoozeReminder = (reminder: Reminder, snoozeDays: number): Reminder => {
  return {
    ...reminder,
    status: 'snoozed',
    snoozedUntil: addDays(new Date(), snoozeDays),
    updatedAt: new Date()
  };
};

/**
 * Mark reminder as completed
 */
export const completeReminder = (reminder: Reminder): Reminder => {
  return {
    ...reminder,
    status: 'completed',
    updatedAt: new Date()
  };
};

/**
 * Get reminders due today
 */
export const getTodaysReminders = (reminders: Reminder[]): Reminder[] => {
  const today = startOfDay(new Date());
  const tomorrow = endOfDay(new Date());

  return reminders.filter(reminder =>
    isWithinInterval(reminder.dueDate, { start: today, end: tomorrow })
  );
};

/**
 * Get overdue reminders
 */
export const getOverdueReminders = (reminders: Reminder[]): Reminder[] => {
  const now = new Date();
  return reminders.filter(reminder => reminder.dueDate < now && reminder.status === 'pending');
};