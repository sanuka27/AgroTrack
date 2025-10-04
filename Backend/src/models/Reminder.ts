import mongoose, { Schema, Document } from 'mongoose';

// Reminder types matching frontend exactly
export type ReminderType = 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'health-check' | 'pest-treatment' | 'soil-change' | 'location-change';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderStatus = 'pending' | 'overdue' | 'completed' | 'snoozed' | 'dismissed';

export type NotificationMethod = 'browser' | 'email' | 'push' | 'in-app';

// Interface for Reminder document
export interface IReminder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User who created the reminder
  plantId: mongoose.Types.ObjectId; // Plant this reminder is for
  plantName: string; // Denormalized for quick access
  type: ReminderType;
  careType: ReminderType; // Alias for type for controller compatibility
  title: string;
  description: string;
  
  // Scheduling
  dueDate: Date;
  scheduledDate: Date; // Alias for dueDate for controller compatibility
  originalDueDate: Date; // Store original for tracking adjustments
  frequency: {
    days: number;
    isFlexible: boolean; // Allow variance in scheduling
    flexibilityDays?: number; // +/- days of flexibility
  };
  
  // Status and priority
  status: ReminderStatus;
  priority: ReminderPriority;
  
  // Snooze functionality
  snoozedUntil?: Date;
  snoozeCount: number;
  maxSnoozes: number;
  
  // Care history context
  lastCareDate?: Date;
  careHistory: {
    totalCares: number;
    averageFrequency: number; // in days
    lastThreeCares: Date[];
  };
  
  // Smart scheduling features
  seasonalAdjustments: {
    winterMultiplier: number; // Reduce frequency in winter (0.5 = half)
    springMultiplier: number; // Increase in spring (1.2 = 20% more)
    summerMultiplier: number; // Summer adjustment
    fallMultiplier: number; // Fall adjustment
  };
  
  // Environmental context
  environmentalFactors: {
    currentSeason?: 'spring' | 'summer' | 'fall' | 'winter';
    weatherImpact?: 'increase' | 'decrease' | 'none'; // Weather-based adjustments
    locationFactor?: number; // Indoor vs outdoor multiplier
  };
  
  // Notification preferences
  notifications: {
    methods: NotificationMethod[];
    advanceNoticeDays: number; // Days before due date to notify
    reminderTimes: string[]; // Times of day to send reminders (HH:MM format)
    enabled: boolean;
  };
  
  // Completion tracking
  completionHistory: {
    completedAt?: Date;
    completedBy?: mongoose.Types.ObjectId;
    wasOnTime: boolean;
    daysOverdue?: number;
    nextReminderGenerated?: boolean;
  }[];
  
  // AI and automation
  aiInsights: {
    confidenceScore: number; // 0-1, how confident AI is in this reminder
    adjustmentReason?: string; // Why AI adjusted the schedule
    learningData: {
      userComplianceRate: number; // How often user completes this type
      plantSpecificPattern: number; // Plant-specific care frequency
      seasonalPattern: number; // Seasonal adjustment learning
    };
  };
  
  // Recurrence settings
  recurrence: {
    enabled: boolean;
    pattern: 'fixed' | 'adaptive' | 'seasonal'; // How to calculate next reminder
    endDate?: Date; // When to stop recurring
    maxOccurrences?: number; // Maximum number of reminders
    currentOccurrence: number;
  };
  
  // User customizations
  customizations: {
    isCustomSchedule: boolean; // User manually set vs AI generated
    userNotes?: string;
    customFrequency?: number; // User override for frequency
    importance: 'optional' | 'recommended' | 'critical';
  };
  
  // Additional controller compatibility fields
  isRecurring: boolean; // For controller compatibility
  
  // System metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  daysUntilDue?: number;
  isOverdue?: boolean;
  nextDueDate?: Date;
  
  // Methods
  getCurrentSeason(month: number): string;
  snooze(days: number): this;
  complete(userId: mongoose.Types.ObjectId): this;
  calculateComplianceRate(): number;
  updatePriority(): this;
}

// Reminder schema definition
const reminderSchema = new Schema<IReminder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  plantId: {
    type: Schema.Types.ObjectId,
    ref: 'Plant',
    required: [true, 'Plant ID is required'],
    index: true
  },
  
  plantName: {
    type: String,
    required: [true, 'Plant name is required'],
    trim: true,
    maxlength: [100, 'Plant name cannot exceed 100 characters']
  },
  
  type: {
    type: String,
    enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'],
    required: [true, 'Reminder type is required'],
    index: true
  },
  
  careType: {
    type: String,
    enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'],
    required: [true, 'Care type is required'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  
  // Scheduling
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    index: true
  },
  
  originalDueDate: {
    type: Date,
    required: [true, 'Original due date is required']
  },
  
  frequency: {
    days: {
      type: Number,
      required: [true, 'Frequency in days is required'],
      min: [1, 'Frequency must be at least 1 day'],
      max: [365, 'Frequency cannot exceed 365 days']
    },
    isFlexible: {
      type: Boolean,
      default: true
    },
    flexibilityDays: {
      type: Number,
      min: [0, 'Flexibility days cannot be negative'],
      max: [7, 'Flexibility cannot exceed 7 days'],
      default: 1
    }
  },
  
  // Status and priority
  status: {
    type: String,
    enum: ['pending', 'overdue', 'completed', 'snoozed', 'dismissed'],
    default: 'pending',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Snooze functionality
  snoozedUntil: {
    type: Date,
    default: null
  },
  
  snoozeCount: {
    type: Number,
    default: 0,
    min: [0, 'Snooze count cannot be negative']
  },
  
  maxSnoozes: {
    type: Number,
    default: 3,
    min: [0, 'Max snoozes cannot be negative'],
    max: [10, 'Max snoozes cannot exceed 10']
  },
  
  // Care history context
  lastCareDate: {
    type: Date,
    default: null
  },
  
  careHistory: {
    totalCares: {
      type: Number,
      default: 0,
      min: [0, 'Total cares cannot be negative']
    },
    averageFrequency: {
      type: Number,
      default: 7, // Default 7 days
      min: [1, 'Average frequency must be at least 1 day']
    },
    lastThreeCares: [{
      type: Date
    }]
  },
  
  // Seasonal adjustments
  seasonalAdjustments: {
    winterMultiplier: {
      type: Number,
      default: 0.7, // 30% less frequent in winter
      min: [0.1, 'Winter multiplier must be at least 0.1'],
      max: [2.0, 'Winter multiplier cannot exceed 2.0']
    },
    springMultiplier: {
      type: Number,
      default: 1.2, // 20% more frequent in spring
      min: [0.1, 'Spring multiplier must be at least 0.1'],
      max: [2.0, 'Spring multiplier cannot exceed 2.0']
    },
    summerMultiplier: {
      type: Number,
      default: 1.3, // 30% more frequent in summer
      min: [0.1, 'Summer multiplier must be at least 0.1'],
      max: [2.0, 'Summer multiplier cannot exceed 2.0']
    },
    fallMultiplier: {
      type: Number,
      default: 0.9, // 10% less frequent in fall
      min: [0.1, 'Fall multiplier must be at least 0.1'],
      max: [2.0, 'Fall multiplier cannot exceed 2.0']
    }
  },
  
  // Environmental factors
  environmentalFactors: {
    currentSeason: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter'],
      default: null
    },
    weatherImpact: {
      type: String,
      enum: ['increase', 'decrease', 'none'],
      default: 'none'
    },
    locationFactor: {
      type: Number,
      default: 1.0,
      min: [0.1, 'Location factor must be at least 0.1'],
      max: [2.0, 'Location factor cannot exceed 2.0']
    }
  },
  
  // Notification preferences
  notifications: {
    methods: [{
      type: String,
      enum: ['browser', 'email', 'push', 'in-app']
    }],
    advanceNoticeDays: {
      type: Number,
      default: 1,
      min: [0, 'Advance notice cannot be negative'],
      max: [30, 'Advance notice cannot exceed 30 days']
    },
    reminderTimes: [{
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    }],
    enabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Completion history
  completionHistory: [{
    completedAt: {
      type: Date,
      required: true
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    wasOnTime: {
      type: Boolean,
      required: true
    },
    daysOverdue: {
      type: Number,
      min: [0, 'Days overdue cannot be negative']
    },
    nextReminderGenerated: {
      type: Boolean,
      default: false
    }
  }],
  
  // AI insights
  aiInsights: {
    confidenceScore: {
      type: Number,
      default: 0.5,
      min: [0, 'Confidence score cannot be less than 0'],
      max: [1, 'Confidence score cannot exceed 1']
    },
    adjustmentReason: {
      type: String,
      maxlength: [500, 'Adjustment reason cannot exceed 500 characters']
    },
    learningData: {
      userComplianceRate: {
        type: Number,
        default: 0.8,
        min: [0, 'Compliance rate cannot be less than 0'],
        max: [1, 'Compliance rate cannot exceed 1']
      },
      plantSpecificPattern: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Plant pattern must be at least 0.1'],
        max: [3.0, 'Plant pattern cannot exceed 3.0']
      },
      seasonalPattern: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Seasonal pattern must be at least 0.1'],
        max: [3.0, 'Seasonal pattern cannot exceed 3.0']
      }
    }
  },
  
  // Recurrence settings
  recurrence: {
    enabled: {
      type: Boolean,
      default: true
    },
    pattern: {
      type: String,
      enum: ['fixed', 'adaptive', 'seasonal'],
      default: 'adaptive'
    },
    endDate: {
      type: Date,
      default: null
    },
    maxOccurrences: {
      type: Number,
      min: [1, 'Max occurrences must be at least 1'],
      max: [1000, 'Max occurrences cannot exceed 1000']
    },
    currentOccurrence: {
      type: Number,
      default: 1,
      min: [1, 'Current occurrence must be at least 1']
    }
  },
  
  // User customizations
  customizations: {
    isCustomSchedule: {
      type: Boolean,
      default: false
    },
    userNotes: {
      type: String,
      maxlength: [500, 'User notes cannot exceed 500 characters']
    },
    customFrequency: {
      type: Number,
      min: [1, 'Custom frequency must be at least 1 day'],
      max: [365, 'Custom frequency cannot exceed 365 days']
    },
    importance: {
      type: String,
      enum: ['optional', 'recommended', 'critical'],
      default: 'recommended'
    }
  },
  
  // System metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Controller compatibility
  isRecurring: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reminderSchema.index({ userId: 1, status: 1, dueDate: 1 });
reminderSchema.index({ plantId: 1, type: 1, isActive: 1 });
reminderSchema.index({ dueDate: 1, status: 1 });
reminderSchema.index({ userId: 1, type: 1, status: 1 });
reminderSchema.index({ status: 1, priority: 1, dueDate: 1 });
reminderSchema.index({ userId: 1, createdAt: -1 });

// Virtual for days until due
reminderSchema.virtual('daysUntilDue').get(function(this: IReminder) {
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue status
reminderSchema.virtual('isOverdue').get(function(this: IReminder) {
  if (this.status === 'completed' || this.status === 'dismissed') return false;
  if (this.status === 'snoozed' && this.snoozedUntil && this.snoozedUntil > new Date()) return false;
  return new Date() > this.dueDate;
});

// Virtual for next due date (for recurring reminders)
reminderSchema.virtual('nextDueDate').get(function(this: IReminder) {
  if (!this.recurrence.enabled || this.status !== 'completed') return null;
  
  const nextDate = new Date(this.dueDate);
  let adjustedFrequency = this.frequency.days;
  
  // Apply seasonal adjustments
  const currentMonth = new Date().getMonth();
  const season = this.getCurrentSeason(currentMonth);
  const multiplier = this.seasonalAdjustments[`${season}Multiplier` as keyof typeof this.seasonalAdjustments];
  
  adjustedFrequency = Math.round(adjustedFrequency * (multiplier as number));
  
  nextDate.setDate(nextDate.getDate() + adjustedFrequency);
  return nextDate;
});

// Method to get current season
reminderSchema.methods.getCurrentSeason = function(month: number) {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

// Method to snooze reminder
reminderSchema.methods.snooze = function(days: number) {
  if (this.snoozeCount >= this.maxSnoozes) {
    throw new Error('Maximum snooze limit reached');
  }
  
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + days);
  
  this.status = 'snoozed';
  this.snoozedUntil = snoozeUntil;
  this.snoozeCount += 1;
  
  return this;
};

// Method to complete reminder
reminderSchema.methods.complete = function(userId: mongoose.Types.ObjectId) {
  const now = new Date();
  const wasOnTime = now <= this.dueDate;
  const daysOverdue = wasOnTime ? 0 : Math.ceil((now.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Add to completion history
  this.completionHistory.push({
    completedAt: now,
    completedBy: userId,
    wasOnTime,
    daysOverdue,
    nextReminderGenerated: false
  });
  
  this.status = 'completed';
  
  // Update AI learning data
  this.aiInsights.learningData.userComplianceRate = this.calculateComplianceRate();
  
  return this;
};

// Method to calculate user compliance rate
reminderSchema.methods.calculateComplianceRate = function() {
  if (this.completionHistory.length === 0) return 0.8; // Default
  
  const onTimeCompletions = this.completionHistory.filter((h: any) => h.wasOnTime).length;
  return onTimeCompletions / this.completionHistory.length;
};

// Method to update priority based on overdue status
reminderSchema.methods.updatePriority = function() {
  const daysOverdue = this.daysUntilDue ? Math.abs(this.daysUntilDue) : 0;
  
  if (this.isOverdue) {
    if (daysOverdue >= 7) {
      this.priority = 'urgent';
    } else if (daysOverdue >= 3) {
      this.priority = 'high';
    } else {
      this.priority = 'medium';
    }
  } else {
    // Reset to default priority if not overdue
    this.priority = 'medium';
  }
  
  return this;
};

// Static method to find due reminders
reminderSchema.statics.findDueReminders = function(userId: mongoose.Types.ObjectId, days = 1) {
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() + days);
  
  return this.find({
    userId,
    isActive: true,
    status: { $in: ['pending', 'overdue'] },
    dueDate: { $lte: checkDate }
  }).sort({ priority: -1, dueDate: 1 });
};

// Static method to find overdue reminders
reminderSchema.statics.findOverdueReminders = function(userId?: mongoose.Types.ObjectId) {
  const query: any = {
    isActive: true,
    status: { $in: ['pending', 'overdue'] },
    dueDate: { $lt: new Date() }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ dueDate: 1 });
};

// Static method to create smart reminder
reminderSchema.statics.createSmartReminder = function(data: {
  userId: mongoose.Types.ObjectId;
  plantId: mongoose.Types.ObjectId;
  plantName: string;
  type: ReminderType;
  baseFrequency: number;
  lastCareDate?: Date;
}) {
  const { userId, plantId, plantName, type, baseFrequency, lastCareDate } = data;
  
  // Calculate smart due date
  const now = new Date();
  const dueDate = new Date(now);
  
  // Adjust frequency based on season
  const currentMonth = now.getMonth();
  const season = currentMonth >= 2 && currentMonth <= 4 ? 'spring' :
                 currentMonth >= 5 && currentMonth <= 7 ? 'summer' :
                 currentMonth >= 8 && currentMonth <= 10 ? 'fall' : 'winter';
  
  const seasonalMultipliers = {
    winter: 0.7,
    spring: 1.2,
    summer: 1.3,
    fall: 0.9
  };
  
  const adjustedFrequency = Math.round(baseFrequency * seasonalMultipliers[season]);
  dueDate.setDate(dueDate.getDate() + adjustedFrequency);
  
  return new this({
    userId,
    plantId,
    plantName,
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${plantName}`,
    description: `Time to ${type.replace('-', ' ')} your ${plantName}`,
    dueDate,
    originalDueDate: new Date(dueDate),
    frequency: {
      days: adjustedFrequency,
      isFlexible: true,
      flexibilityDays: Math.min(2, Math.ceil(adjustedFrequency * 0.1))
    },
    lastCareDate,
    environmentalFactors: {
      currentSeason: season
    },
    notifications: {
      methods: ['in-app', 'browser'],
      advanceNoticeDays: 1,
      reminderTimes: ['09:00', '18:00'],
      enabled: true
    }
  });
};

// Pre-save middleware to update status
reminderSchema.pre('save', function(next) {
  // Auto-update overdue status
  if (this.isOverdue && this.status === 'pending') {
    this.status = 'overdue';
  }
  
  // Update priority based on overdue status
  this.updatePriority();
  
  next();
});

// Create and export the model
export const Reminder = mongoose.model<IReminder>('Reminder', reminderSchema);