import mongoose, { Schema, Document } from 'mongoose';

// System metric type enum
export enum SystemMetricType {
  // Performance metrics
  API_RESPONSE_TIME = 'api_response_time',
  DATABASE_QUERY_TIME = 'database_query_time',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  DISK_USAGE = 'disk_usage',
  
  // Usage metrics
  ACTIVE_USERS = 'active_users',
  NEW_REGISTRATIONS = 'new_registrations',
  PAGE_VIEWS = 'page_views',
  API_REQUESTS = 'api_requests',
  
  // Feature usage
  PLANTS_CREATED = 'plants_created',
  CARE_LOGS_CREATED = 'care_logs_created',
  REMINDERS_SET = 'reminders_set',
  FORUM_POSTS = 'forum_posts',
  BLOG_VIEWS = 'blog_views',
  
  // Error metrics
  ERROR_RATE = 'error_rate',
  FAILED_REQUESTS = 'failed_requests',
  CRITICAL_ERRORS = 'critical_errors',
  
  // Business metrics
  USER_RETENTION = 'user_retention',
  FEATURE_ADOPTION = 'feature_adoption',
  USER_SATISFACTION = 'user_satisfaction'
}

// Metric aggregation period enum
export enum MetricPeriod {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

// Interface for SystemMetrics document
export interface ISystemMetrics extends Document {
  _id: mongoose.Types.ObjectId;
  metricType: SystemMetricType;
  period: MetricPeriod;
  
  // Metric values
  value: number;
  count: number;
  minimum: number;
  maximum: number;
  average: number;
  
  // Metadata
  metadata: {
    [key: string]: any;
  };
  
  // Time information
  timestamp: Date;
  periodStart: Date;
  periodEnd: Date;
  
  // Comparative data
  previousPeriodValue?: number;
  changeFromPrevious?: number;
  changePercentage?: number;
  
  // Aggregation info
  dataPoints: number;
  isEstimated: boolean;
  confidence: number;
  
  // Created timestamp
  createdAt: Date;
  
  // Methods
  calculateChange(): void;
  isSignificantChange(): boolean;
  getTrendDirection(): 'up' | 'down' | 'stable';
}

// SystemMetrics schema
const systemMetricsSchema = new Schema<ISystemMetrics>({
  metricType: {
    type: String,
    enum: Object.values(SystemMetricType),
    required: [true, 'Metric type is required'],
    index: true
  },
  
  period: {
    type: String,
    enum: Object.values(MetricPeriod),
    required: [true, 'Period is required'],
    index: true
  },
  
  value: {
    type: Number,
    required: [true, 'Metric value is required']
  },
  
  count: {
    type: Number,
    default: 1,
    min: 0
  },
  
  minimum: {
    type: Number,
    required: true
  },
  
  maximum: {
    type: Number,
    required: true
  },
  
  average: {
    type: Number,
    required: true
  },
  
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    index: true
  },
  
  periodStart: {
    type: Date,
    required: [true, 'Period start is required'],
    index: true
  },
  
  periodEnd: {
    type: Date,
    required: [true, 'Period end is required'],
    index: true
  },
  
  previousPeriodValue: {
    type: Number
  },
  
  changeFromPrevious: {
    type: Number
  },
  
  changePercentage: {
    type: Number
  },
  
  dataPoints: {
    type: Number,
    default: 1,
    min: 1
  },
  
  isEstimated: {
    type: Boolean,
    default: false
  },
  
  confidence: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
systemMetricsSchema.index({ metricType: 1, period: 1, timestamp: -1 });
systemMetricsSchema.index({ period: 1, periodStart: 1 });
systemMetricsSchema.index({ metricType: 1, periodStart: 1, periodEnd: 1 });

// TTL index to automatically delete old metrics after 2 years
systemMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Method to calculate change from previous period
systemMetricsSchema.methods.calculateChange = function(): void {
  if (this.previousPeriodValue !== undefined && this.previousPeriodValue !== null) {
    this.changeFromPrevious = this.value - this.previousPeriodValue;
    this.changePercentage = this.previousPeriodValue !== 0 
      ? (this.changeFromPrevious / this.previousPeriodValue) * 100 
      : 0;
  }
};

// Method to check if change is significant
systemMetricsSchema.methods.isSignificantChange = function(): boolean {
  if (!this.changePercentage) return false;
  
  // Define significance thresholds based on metric type
  const thresholds: Record<string, number> = {
    [SystemMetricType.ERROR_RATE]: 10, // 10% change is significant for errors
    [SystemMetricType.API_RESPONSE_TIME]: 20, // 20% change in response time
    [SystemMetricType.ACTIVE_USERS]: 15, // 15% change in active users
    [SystemMetricType.NEW_REGISTRATIONS]: 25, // 25% change in registrations
    default: 20 // Default 20% threshold
  };
  
  const threshold = thresholds[this.metricType] || thresholds.default || 20;
  return Math.abs(this.changePercentage) >= threshold;
};

// Method to get trend direction
systemMetricsSchema.methods.getTrendDirection = function(): 'up' | 'down' | 'stable' {
  if (!this.changePercentage) return 'stable';
  
  const threshold = 5; // 5% threshold for stability
  
  if (this.changePercentage > threshold) return 'up';
  if (this.changePercentage < -threshold) return 'down';
  return 'stable';
};

// Pre-save middleware
systemMetricsSchema.pre('save', function(next) {
  // Calculate change if not already done
  if (this.previousPeriodValue !== undefined && !this.changeFromPrevious) {
    this.calculateChange();
  }
  
  // Ensure minimum/maximum are set correctly
  if (this.minimum > this.value) this.minimum = this.value;
  if (this.maximum < this.value) this.maximum = this.value;
  
  next();
});

// Static methods for analytics
systemMetricsSchema.statics.getMetricHistory = function(
  metricType: SystemMetricType,
  period: MetricPeriod,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    metricType,
    period,
    periodStart: { $gte: startDate },
    periodEnd: { $lte: endDate }
  }).sort({ periodStart: 1 });
};

systemMetricsSchema.statics.getLatestMetrics = function(period: MetricPeriod = MetricPeriod.DAY) {
  return this.aggregate([
    { $match: { period } },
    {
      $sort: { metricType: 1, timestamp: -1 }
    },
    {
      $group: {
        _id: '$metricType',
        latestMetric: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$latestMetric' }
    },
    {
      $sort: { metricType: 1 }
    }
  ]);
};

systemMetricsSchema.statics.getPerformanceSummary = function(startDate: Date, endDate: Date) {
  const performanceMetrics = [
    SystemMetricType.API_RESPONSE_TIME,
    SystemMetricType.DATABASE_QUERY_TIME,
    SystemMetricType.MEMORY_USAGE,
    SystemMetricType.CPU_USAGE,
    SystemMetricType.ERROR_RATE
  ];
  
  return this.aggregate([
    {
      $match: {
        metricType: { $in: performanceMetrics },
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$metricType',
        averageValue: { $avg: '$average' },
        minValue: { $min: '$minimum' },
        maxValue: { $max: '$maximum' },
        dataPoints: { $sum: '$dataPoints' }
      }
    }
  ]);
};

systemMetricsSchema.statics.getUsageSummary = function(startDate: Date, endDate: Date) {
  const usageMetrics = [
    SystemMetricType.ACTIVE_USERS,
    SystemMetricType.PAGE_VIEWS,
    SystemMetricType.API_REQUESTS,
    SystemMetricType.PLANTS_CREATED,
    SystemMetricType.CARE_LOGS_CREATED
  ];
  
  return this.aggregate([
    {
      $match: {
        metricType: { $in: usageMetrics },
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$metricType',
        totalValue: { $sum: '$value' },
        averageValue: { $avg: '$value' },
        peakValue: { $max: '$maximum' }
      }
    }
  ]);
};

systemMetricsSchema.statics.getAlerts = function() {
  return this.find({
    $or: [
      { metricType: SystemMetricType.ERROR_RATE, value: { $gte: 5 } }, // Error rate >= 5%
      { metricType: SystemMetricType.API_RESPONSE_TIME, average: { $gte: 2000 } }, // Response time >= 2s
      { metricType: SystemMetricType.MEMORY_USAGE, value: { $gte: 85 } }, // Memory usage >= 85%
      { metricType: SystemMetricType.CPU_USAGE, value: { $gte: 80 } } // CPU usage >= 80%
    ],
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ timestamp: -1 });
};

systemMetricsSchema.statics.recordMetric = async function(
  metricType: SystemMetricType,
  value: number,
  period: MetricPeriod = MetricPeriod.HOUR,
  metadata: any = {}
): Promise<ISystemMetrics> {
  const now = new Date();
  const { periodStart, periodEnd } = calculatePeriodBounds(now, period);
  
  // Try to find existing metric for this period
  let existingMetric = await this.findOne({
    metricType,
    period,
    periodStart,
    periodEnd
  });
  
  if (existingMetric) {
    // Update existing metric
    existingMetric.count += 1;
    existingMetric.value = ((existingMetric.value * (existingMetric.count - 1)) + value) / existingMetric.count;
    existingMetric.minimum = Math.min(existingMetric.minimum, value);
    existingMetric.maximum = Math.max(existingMetric.maximum, value);
    existingMetric.average = existingMetric.value;
    existingMetric.dataPoints += 1;
    existingMetric.timestamp = now;
    
    return await existingMetric.save();
  } else {
    // Create new metric
    return await this.create({
      metricType,
      period,
      value,
      count: 1,
      minimum: value,
      maximum: value,
      average: value,
      metadata,
      timestamp: now,
      periodStart,
      periodEnd,
      dataPoints: 1
    });
  }
};

function calculatePeriodBounds(timestamp: Date, period: MetricPeriod) {
  const date = new Date(timestamp);
  let periodStart: Date, periodEnd: Date;
  
  switch (period) {
    case MetricPeriod.MINUTE:
      periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
      periodEnd = new Date(periodStart.getTime() + 60 * 1000);
      break;
    case MetricPeriod.HOUR:
      periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
      periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000);
      break;
    case MetricPeriod.DAY:
      periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
      break;
    case MetricPeriod.WEEK:
      const dayOfWeek = date.getDay();
      periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOfWeek);
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case MetricPeriod.MONTH:
      periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
      periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      break;
    default:
      periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
      periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000);
  }
  
  return { periodStart, periodEnd };
};

// Create and export the model
export const SystemMetrics = mongoose.model<ISystemMetrics>('SystemMetrics', systemMetricsSchema);