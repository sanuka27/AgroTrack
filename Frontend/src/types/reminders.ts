export type ReminderType = 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'health-check' | 'pest-treatment' | 'soil-change' | 'location-change';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderStatus = 'pending' | 'overdue' | 'completed' | 'snoozed';

export type NotificationMethod = 'browser' | 'email' | 'push' | 'in-app';

export interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  type: ReminderType;
  title: string;
  description: string;
  dueDate: Date;
  priority: ReminderPriority;
  status: ReminderStatus;
  snoozedUntil?: Date;
  lastCareDate?: Date;
  frequency: {
    days: number;
    isFlexible: boolean; // Allow some variance in scheduling
  };
  seasonalAdjustments?: {
    winterMultiplier: number; // Reduce frequency in winter
    summerMultiplier: number; // Increase frequency in summer
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderPreferences {
  enabled: boolean;
  notificationMethods: NotificationMethod[];
  advanceNoticeDays: number; // Days before due date to show reminder
  maxRemindersPerDay: number;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  plantSpecificSettings: Record<string, {
    enabled: boolean;
    customFrequency?: Record<ReminderType, number>;
  }>;
}

export interface ReminderHistory {
  reminderId: string;
  action: 'completed' | 'snoozed' | 'dismissed';
  timestamp: Date;
  notes?: string;
}

export interface SmartReminderConfig {
  // Plant type specific default frequencies (days)
  plantTypeDefaults: Record<string, Record<ReminderType, number>>;
  // Seasonal multipliers
  seasonalMultipliers: {
    winter: number; // Dec-Feb
    spring: number; // Mar-May
    summer: number; // Jun-Aug
    fall: number; // Sep-Nov
  };
  // Priority thresholds (days overdue)
  priorityThresholds: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}