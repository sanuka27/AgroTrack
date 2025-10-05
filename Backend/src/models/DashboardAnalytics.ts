import mongoose, { Schema, Document } from 'mongoose';

// Dashboard widget type enum
export enum DashboardWidgetType {
  PLANT_OVERVIEW = 'plant_overview',
  CARE_SUMMARY = 'care_summary',
  REMINDER_STATUS = 'reminder_status',
  HEALTH_TRENDS = 'health_trends',
  ACTIVITY_FEED = 'activity_feed',
  COMMUNITY_STATS = 'community_stats',
  BLOG_ENGAGEMENT = 'blog_engagement',
  USER_ACHIEVEMENTS = 'user_achievements',
  WEATHER_INTEGRATION = 'weather_integration',
  AI_INSIGHTS = 'ai_insights'
}

// Data refresh frequency enum
export enum RefreshFrequency {
  REAL_TIME = 'real_time',
  EVERY_5_MIN = '5_minutes',
  EVERY_15_MIN = '15_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily'
}

// Interface for DashboardAnalytics document
export interface IDashboardAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  widgetType: DashboardWidgetType;
  
  // Widget data
  data: {
    [key: string]: any;
  };
  
  // Configuration
  config: {
    refreshFrequency: RefreshFrequency;
    isEnabled: boolean;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    customSettings: {
      [key: string]: any;
    };
  };
  
  // Data metadata
  dataMetadata: {
    lastUpdated: Date;
    nextUpdate: Date;
    dataSource: string;
    isStale: boolean;
    errorCount: number;
    lastError?: string;
  };
  
  // Performance metrics
  performance: {
    loadTime: number;
    dataSize: number;
    cacheHit: boolean;
    queryTime: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isDataStale(): boolean;
  shouldRefresh(): boolean;
  updateData(newData: any): Promise<void>;
  getRefreshInterval(): number;
  calculateNextUpdate(): Date;
}

// DashboardAnalytics schema
const dashboardAnalyticsSchema = new Schema<IDashboardAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  widgetType: {
    type: String,
    enum: Object.values(DashboardWidgetType),
    required: [true, 'Widget type is required']
  },
  
  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Widget data is required'],
    default: {}
  },
  
  config: {
    refreshFrequency: {
      type: String,
      enum: Object.values(RefreshFrequency),
      default: RefreshFrequency.HOURLY
    },
    isEnabled: {
      type: Boolean,
      default: true
    },
    position: {
      x: {
        type: Number,
        default: 0,
        min: 0
      },
      y: {
        type: Number,
        default: 0,
        min: 0
      },
      width: {
        type: Number,
        default: 4,
        min: 1,
        max: 12
      },
      height: {
        type: Number,
        default: 3,
        min: 1,
        max: 8
      }
    },
    customSettings: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  
  dataMetadata: {
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now
    },
    nextUpdate: {
      type: Date,
      required: true
    },
    dataSource: {
      type: String,
      required: true,
      default: 'internal'
    },
    isStale: {
      type: Boolean,
      default: false
    },
    errorCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastError: {
      type: String
    }
  },
  
  performance: {
    loadTime: {
      type: Number,
      default: 0,
      min: 0
    },
    dataSize: {
      type: Number,
      default: 0,
      min: 0
    },
    cacheHit: {
      type: Boolean,
      default: false
    },
    queryTime: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
dashboardAnalyticsSchema.index({ userId: 1, widgetType: 1 }, { unique: true });
dashboardAnalyticsSchema.index({ userId: 1, 'config.isEnabled': 1 });
dashboardAnalyticsSchema.index({ 'dataMetadata.nextUpdate': 1, 'config.isEnabled': 1 });
dashboardAnalyticsSchema.index({ 'dataMetadata.isStale': 1 });

// ✅ Duplicate index removed to avoid Mongoose warning

// Virtual for user details
dashboardAnalyticsSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  select: 'name email preferences'
});

// Method to check if data is stale
dashboardAnalyticsSchema.methods.isDataStale = function(): boolean {
  return this.dataMetadata.isStale || new Date() > this.dataMetadata.nextUpdate;
};

// Method to check if widget should refresh
dashboardAnalyticsSchema.methods.shouldRefresh = function(): boolean {
  return this.config.isEnabled && this.isDataStale();
};

// Method to update widget data
dashboardAnalyticsSchema.methods.updateData = async function(newData: any): Promise<void> {
  const startTime = Date.now();
  
  this.data = newData;
  this.dataMetadata.lastUpdated = new Date();
  this.dataMetadata.nextUpdate = this.calculateNextUpdate();
  this.dataMetadata.isStale = false;
  this.dataMetadata.errorCount = 0;
  this.dataMetadata.lastError = undefined;
  
  // Update performance metrics
  this.performance.loadTime = Date.now() - startTime;
  this.performance.dataSize = JSON.stringify(newData).length;
  
  await this.save();
};

// Method to get refresh interval in milliseconds
dashboardAnalyticsSchema.methods.getRefreshInterval = function(): number {
  const intervals = {
    [RefreshFrequency.REAL_TIME]: 0,
    [RefreshFrequency.EVERY_5_MIN]: 5 * 60 * 1000,
    [RefreshFrequency.EVERY_15_MIN]: 15 * 60 * 1000,
    [RefreshFrequency.HOURLY]: 60 * 60 * 1000,
    [RefreshFrequency.DAILY]: 24 * 60 * 60 * 1000
  };
  
  return intervals[this.config.refreshFrequency as RefreshFrequency] || intervals[RefreshFrequency.HOURLY];
};

// Method to calculate next update time
dashboardAnalyticsSchema.methods.calculateNextUpdate = function(): Date {
  const interval = this.getRefreshInterval();
  return new Date(Date.now() + interval);
};

// Pre-save middleware
dashboardAnalyticsSchema.pre('save', function(next) {
  // Calculate next update if not set
  if (!this.dataMetadata.nextUpdate) {
    this.dataMetadata.nextUpdate = this.calculateNextUpdate();
  }
  
  // Mark as stale if past next update time
  if (new Date() > this.dataMetadata.nextUpdate) {
    this.dataMetadata.isStale = true;
  }
  
  next();
});

// Static methods
dashboardAnalyticsSchema.statics.getUserDashboard = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    userId,
    'config.isEnabled': true
  }).sort({ 'config.position.y': 1, 'config.position.x': 1 });
};

dashboardAnalyticsSchema.statics.getStaleWidgets = function() {
  return this.find({
    'config.isEnabled': true,
    $or: [
      { 'dataMetadata.isStale': true },
      { 'dataMetadata.nextUpdate': { $lte: new Date() } }
    ]
  });
};

dashboardAnalyticsSchema.statics.getWidgetsByType = function(widgetType: DashboardWidgetType) {
  return this.find({
    widgetType,
    'config.isEnabled': true
  });
};

dashboardAnalyticsSchema.statics.createDefaultDashboard = async function(userId: mongoose.Types.ObjectId) {
  const defaultWidgets = [
    {
      userId,
      widgetType: DashboardWidgetType.PLANT_OVERVIEW,
      data: { totalPlants: 0, healthyPlants: 0, needAttention: 0 },
      config: {
        refreshFrequency: RefreshFrequency.HOURLY,
        isEnabled: true,
        position: { x: 0, y: 0, width: 6, height: 3 }
      }
    },
    {
      userId,
      widgetType: DashboardWidgetType.CARE_SUMMARY,
      data: { todaysCare: 0, weeklyGoal: 0, completionRate: 0 },
      config: {
        refreshFrequency: RefreshFrequency.EVERY_15_MIN,
        isEnabled: true,
        position: { x: 6, y: 0, width: 6, height: 3 }
      }
    },
    {
      userId,
      widgetType: DashboardWidgetType.REMINDER_STATUS,
      data: { dueToday: 0, overdue: 0, upcoming: 0 },
      config: {
        refreshFrequency: RefreshFrequency.EVERY_5_MIN,
        isEnabled: true,
        position: { x: 0, y: 3, width: 4, height: 3 }
      }
    },
    {
      userId,
      widgetType: DashboardWidgetType.HEALTH_TRENDS,
      data: { trend: 'stable', changePercent: 0, chartData: [] },
      config: {
        refreshFrequency: RefreshFrequency.DAILY,
        isEnabled: true,
        position: { x: 4, y: 3, width: 8, height: 4 }
      }
    },
    {
      userId,
      widgetType: DashboardWidgetType.ACTIVITY_FEED,
      data: { recentActivities: [], unreadCount: 0 },
      config: {
        refreshFrequency: RefreshFrequency.EVERY_15_MIN,
        isEnabled: true,
        position: { x: 0, y: 7, width: 12, height: 3 }
      }
    }
  ];
  
  // Insert default widgets
  for (const widget of defaultWidgets) {
    await this.findOneAndUpdate(
      { userId: widget.userId, widgetType: widget.widgetType },
      widget,
      { upsert: true, new: true }
    );
  }
  
  return this.find({
    userId,
    'config.isEnabled': true
  }).sort({ 'config.position.y': 1, 'config.position.x': 1 });
};

dashboardAnalyticsSchema.statics.updateWidgetPosition = async function(
  userId: mongoose.Types.ObjectId,
  widgetType: DashboardWidgetType,
  position: { x: number; y: number; width: number; height: number }
) {
  return this.findOneAndUpdate(
    { userId, widgetType },
    { 'config.position': position },
    { new: true }
  );
};

dashboardAnalyticsSchema.statics.toggleWidget = async function(
  userId: mongoose.Types.ObjectId,
  widgetType: DashboardWidgetType,
  isEnabled: boolean
) {
  return this.findOneAndUpdate(
    { userId, widgetType },
    { 'config.isEnabled': isEnabled },
    { new: true }
  );
};

dashboardAnalyticsSchema.statics.getPerformanceMetrics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$widgetType',
        averageLoadTime: { $avg: '$performance.loadTime' },
        averageDataSize: { $avg: '$performance.dataSize' },
        cacheHitRate: {
          $avg: { $cond: ['$performance.cacheHit', 1, 0] }
        },
        totalWidgets: { $sum: 1 }
      }
    },
    {
      $sort: { averageLoadTime: -1 }
    }
  ]);
};

// Create and export the model
export const DashboardAnalytics = mongoose.model<IDashboardAnalytics>('DashboardAnalytics', dashboardAnalyticsSchema);