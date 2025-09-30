import mongoose, { Schema, Document } from 'mongoose';

// Event type enum for different analytics events
export enum AnalyticsEventType {
  // User events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_PROFILE_UPDATE = 'user_profile_update',
  
  // Plant events
  PLANT_ADDED = 'plant_added',
  PLANT_UPDATED = 'plant_updated',
  PLANT_DELETED = 'plant_deleted',
  PLANT_VIEWED = 'plant_viewed',
  
  // Care events
  CARE_LOG_CREATED = 'care_log_created',
  CARE_LOG_UPDATED = 'care_log_updated',
  CARE_LOG_DELETED = 'care_log_deleted',
  REMINDER_CREATED = 'reminder_created',
  REMINDER_COMPLETED = 'reminder_completed',
  REMINDER_SNOOZED = 'reminder_snoozed',
  
  // Community events
  POST_CREATED = 'post_created',
  POST_VIEWED = 'post_viewed',
  POST_LIKED = 'post_liked',
  POST_SHARED = 'post_shared',
  COMMENT_CREATED = 'comment_created',
  COMMENT_LIKED = 'comment_liked',
  
  // Blog events
  BLOG_POST_VIEWED = 'blog_post_viewed',
  BLOG_POST_LIKED = 'blog_post_liked',
  BLOG_POST_SHARED = 'blog_post_shared',
  BLOG_POST_BOOKMARKED = 'blog_post_bookmarked',
  
  // App usage events
  PAGE_VIEW = 'page_view',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  FEATURE_USED = 'feature_used',
  
  // AI events
  AI_SUGGESTION_REQUESTED = 'ai_suggestion_requested',
  AI_SUGGESTION_ACCEPTED = 'ai_suggestion_accepted',
  AI_SUGGESTION_REJECTED = 'ai_suggestion_rejected',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
  API_ERROR = 'api_error'
}

// Interface for UserAnalytics document
export interface IUserAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: AnalyticsEventType;
  
  // Event details
  eventData: {
    [key: string]: any;
  };
  
  // Context information
  sessionId?: string;
  deviceInfo?: {
    userAgent?: string;
    device?: string;
    browser?: string;
    os?: string;
    screen?: {
      width: number;
      height: number;
    };
  };
  
  // Location data
  location?: {
    ip?: string;
    country?: string;
    city?: string;
    timezone?: string;
  };
  
  // Performance metrics
  performance?: {
    loadTime?: number;
    responseTime?: number;
    memoryUsage?: number;
  };
  
  // Metadata
  timestamp: Date;
  createdAt: Date;
  
  // Methods
  static trackEvent(
    userId: mongoose.Types.ObjectId,
    eventType: AnalyticsEventType,
    eventData?: any,
    context?: any
  ): Promise<IUserAnalytics>;
}

// UserAnalytics schema
const userAnalyticsSchema = new Schema<IUserAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  eventType: {
    type: String,
    enum: Object.values(AnalyticsEventType),
    required: [true, 'Event type is required'],
    index: true
  },
  
  eventData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  sessionId: {
    type: String,
    index: true
  },
  
  deviceInfo: {
    userAgent: String,
    device: String,
    browser: String,
    os: String,
    screen: {
      width: Number,
      height: Number
    }
  },
  
  location: {
    ip: String,
    country: String,
    city: String,
    timezone: String
  },
  
  performance: {
    loadTime: Number,
    responseTime: Number,
    memoryUsage: Number
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for analytics queries
userAnalyticsSchema.index({ userId: 1, timestamp: -1 });
userAnalyticsSchema.index({ eventType: 1, timestamp: -1 });
userAnalyticsSchema.index({ sessionId: 1, timestamp: -1 });
userAnalyticsSchema.index({ timestamp: -1 });
userAnalyticsSchema.index({ 'location.country': 1, timestamp: -1 });

// TTL index to automatically delete old analytics data after 2 years
userAnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to track events
userAnalyticsSchema.statics.trackEvent = async function(
  userId: mongoose.Types.ObjectId,
  eventType: AnalyticsEventType,
  eventData: any = {},
  context: any = {}
): Promise<IUserAnalytics> {
  const analyticsData = {
    userId,
    eventType,
    eventData,
    sessionId: context.sessionId,
    deviceInfo: context.deviceInfo,
    location: context.location,
    performance: context.performance,
    timestamp: new Date()
  };
  
  return await this.create(analyticsData);
};

// Static methods for analytics queries
userAnalyticsSchema.statics.getUserEvents = function(
  userId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

userAnalyticsSchema.statics.getEventCounts = function(
  eventType?: AnalyticsEventType,
  startDate?: Date,
  endDate?: Date
) {
  const match: any = {};
  
  if (eventType) match.eventType = eventType;
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

userAnalyticsSchema.statics.getActiveUsers = function(
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        eventType: { $in: [AnalyticsEventType.USER_LOGIN, AnalyticsEventType.PAGE_VIEW] }
      }
    },
    {
      $group: {
        _id: '$userId',
        lastActivity: { $max: '$timestamp' },
        eventCount: { $sum: 1 }
      }
    },
    {
      $count: 'activeUsers'
    }
  ]);
};

// Create and export the model
export const UserAnalytics = mongoose.model<IUserAnalytics>('UserAnalytics', userAnalyticsSchema);