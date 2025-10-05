import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  pushTokens: string[]; // For mobile push notifications
  preferences: {
    reminders: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
      frequency: 'immediate' | 'daily' | 'weekly';
      quietHours: {
        start: string; // HH:MM format
        end: string;   // HH:MM format
        timezone: string;
      };
    };
    alerts: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
      urgentOnly: boolean;
    };
    tips: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
      frequency: 'daily' | 'weekly' | 'monthly';
      categories: string[]; // Plant categories interested in
    };
    community: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
      newPosts: boolean;
      replies: boolean;
      likes: boolean;
    };
    expert: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
      consultationUpdates: boolean;
      newMessages: boolean;
    };
    system: {
      enabled: boolean;
      channels: ('email' | 'push')[];
      maintenanceNotices: boolean;
      securityAlerts: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  isNotificationEnabled(type: string, channel: string): boolean;
  getOrCreateForUser(userId: mongoose.Types.ObjectId): Promise<INotificationPreference>;
  addPushToken(token: string): Promise<INotificationPreference>;
  removePushToken(token: string): Promise<INotificationPreference>;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailEnabled: {
    type: Boolean,
    default: true
  },
  pushEnabled: {
    type: Boolean,
    default: true
  },
  smsEnabled: {
    type: Boolean,
    default: false
  },
  emailAddress: {
    type: String,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  pushTokens: [{
    type: String,
    trim: true
  }],
  preferences: {
    reminders: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['email', 'push', 'sms'],
        default: ['push']
      }],
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly'],
        default: 'immediate'
      },
      quietHours: {
        start: {
          type: String,
          default: '22:00'
        },
        end: {
          type: String,
          default: '08:00'
        },
        timezone: {
          type: String,
          default: 'UTC'
        }
      }
    },
    alerts: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['email', 'push', 'sms'],
        default: ['push', 'email']
      }],
      urgentOnly: {
        type: Boolean,
        default: false
      }
    },
    tips: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['email', 'push', 'sms'],
        default: ['push']
      }],
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      categories: [{
        type: String,
        default: []
      }]
    },
    community: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['email', 'push', 'sms'],
        default: ['push']
      }],
      newPosts: {
        type: Boolean,
        default: false
      },
      replies: {
        type: Boolean,
        default: true
      },
      likes: {
        type: Boolean,
        default: false
      }
    },
    expert: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['email', 'push', 'sms'],
        default: ['push', 'email']
      }],
      consultationUpdates: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      }
    },
    system: {
      enabled: {
        type: Boolean,
        default: true
      },
      channels: [{
        type: String,
        enum: ['email', 'push', 'sms'],
        default: ['email']
      }],
      maintenanceNotices: {
        type: Boolean,
        default: true
      },
      securityAlerts: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Extend interface for instance methods
interface INotificationPreferenceMethods {
  addPushToken(token: string): Promise<INotificationPreference>;
  removePushToken(token: string): Promise<INotificationPreference>;
  isNotificationEnabled(type: string, channel: string): boolean;
}

// Extend interface for static methods
interface INotificationPreferenceModel extends mongoose.Model<INotificationPreference, {}, INotificationPreferenceMethods> {
  getOrCreateForUser(userId: mongoose.Types.ObjectId): Promise<INotificationPreference>;
}

// Static method to get or create preferences for user
notificationPreferenceSchema.statics.getOrCreateForUser = async function(userId: mongoose.Types.ObjectId) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    preferences = await this.create({ userId });
  }
  
  return preferences;
};

// Instance method to update push token
notificationPreferenceSchema.methods.addPushToken = function(token: string) {
  if (!this.pushTokens.includes(token)) {
    this.pushTokens.push(token);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove push token
notificationPreferenceSchema.methods.removePushToken = function(token: string) {
  this.pushTokens = this.pushTokens.filter((t: string) => t !== token);
  return this.save();
};

// Instance method to check if notification type is enabled
notificationPreferenceSchema.methods.isNotificationEnabled = function(
  this: INotificationPreference,
  type: string, 
  channel: string
): boolean {
  const typePrefs = this.preferences[type as keyof typeof this.preferences];
  if (!typePrefs || !typePrefs.enabled) return false;
  
  // Check global channel enablement
  let globalEnabled = false;
  switch (channel) {
    case 'email':
      globalEnabled = this.emailEnabled;
      break;
    case 'push':
      globalEnabled = this.pushEnabled;
      break;
    case 'sms':
      globalEnabled = this.smsEnabled;
      break;
  }
  
  if (!globalEnabled) return false;
  
  return (typePrefs.channels as string[]).includes(channel);
};

export const NotificationPreference = mongoose.model<INotificationPreference, INotificationPreferenceModel>('NotificationPreference', notificationPreferenceSchema);