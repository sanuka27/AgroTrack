import mongoose, { Schema, Document } from 'mongoose';

// Plant care success metrics enum
export enum CareMetricType {
  HEALTH_SCORE = 'health_score',
  GROWTH_RATE = 'growth_rate',
  CARE_FREQUENCY = 'care_frequency',
  WATERING_CONSISTENCY = 'watering_consistency',
  FERTILIZER_EFFECTIVENESS = 'fertilizer_effectiveness',
  SURVIVAL_RATE = 'survival_rate',
  PROBLEM_RESOLUTION = 'problem_resolution',
  USER_SATISFACTION = 'user_satisfaction'
}

// Care success level enum
export enum CareSuccessLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  AVERAGE = 'average',
  POOR = 'poor',
  CRITICAL = 'critical'
}

// Interface for PlantCareAnalytics document
export interface IPlantCareAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plantId: mongoose.Types.ObjectId;
  
  // Metrics data
  metricType: CareMetricType;
  value: number;
  previousValue?: number;
  change: number; // Percentage change from previous
  successLevel: CareSuccessLevel;
  
  // Analysis details
  analysisData: {
    careLogsAnalyzed: number;
    timeframeStart: Date;
    timeframeEnd: Date;
    factors: {
      factor: string;
      impact: number; // -100 to 100
      description: string;
    }[];
    recommendations: string[];
    confidence: number; // 0-100
  };
  
  // Comparative data
  comparison: {
    userAverage: number;
    plantTypeAverage: number;
    globalAverage: number;
    percentile: number; // Where this plant ranks (0-100)
  };
  
  // Trends
  trend: {
    direction: 'improving' | 'stable' | 'declining';
    rate: number; // Rate of change per day
    prediction: {
      nextWeek: number;
      nextMonth: number;
      confidence: number;
    };
  };
  
  // Metadata
  calculatedAt: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isOutdated(): boolean;
  getSuccessMessage(): string;
  getActionItems(): string[];
  calculateRank(): Promise<number>;
}

// PlantCareAnalytics schema
const plantCareAnalyticsSchema = new Schema<IPlantCareAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  plantId: {
    type: Schema.Types.ObjectId,
    ref: 'Plant',
    required: [true, 'Plant ID is required']
  },
  
  metricType: {
    type: String,
    enum: Object.values(CareMetricType),
    required: [true, 'Metric type is required']
  },
  
  value: {
    type: Number,
    required: [true, 'Metric value is required'],
    min: 0,
    max: 100
  },
  
  previousValue: {
    type: Number,
    min: 0,
    max: 100
  },
  
  change: {
    type: Number,
    default: 0
  },
  
  successLevel: {
    type: String,
    enum: Object.values(CareSuccessLevel),
    required: [true, 'Success level is required']
  },
  
  analysisData: {
    careLogsAnalyzed: {
      type: Number,
      required: true,
      min: 0
    },
    timeframeStart: {
      type: Date,
      required: true
    },
    timeframeEnd: {
      type: Date,
      required: true
    },
    factors: [{
      factor: {
        type: String,
        required: true
      },
      impact: {
        type: Number,
        required: true,
        min: -100,
        max: 100
      },
      description: {
        type: String,
        required: true
      }
    }],
    recommendations: [String],
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  
  comparison: {
    userAverage: Number,
    plantTypeAverage: Number,
    globalAverage: Number,
    percentile: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  trend: {
    direction: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    prediction: {
      nextWeek: Number,
      nextMonth: Number,
      confidence: {
        type: Number,
        min: 0,
        max: 100
      }
    }
  },
  
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  
  validUntil: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
plantCareAnalyticsSchema.index({ userId: 1, plantId: 1, metricType: 1 });
plantCareAnalyticsSchema.index({ plantId: 1, metricType: 1, calculatedAt: -1 });
plantCareAnalyticsSchema.index({ metricType: 1, successLevel: 1 });
plantCareAnalyticsSchema.index({ validUntil: 1 }); // For cleanup

// ✅ Duplicate index removed to avoid Mongoose warning

// Virtual for plant details
plantCareAnalyticsSchema.virtual('plantDetails', {
  ref: 'Plant',
  localField: 'plantId',
  foreignField: '_id',
  justOne: true,
  select: 'name category species healthScore'
});

// Method to check if analytics data is outdated
plantCareAnalyticsSchema.methods.isOutdated = function(): boolean {
  return new Date() > this.validUntil;
};

// Method to get success message based on level and metric
plantCareAnalyticsSchema.methods.getSuccessMessage = function(): string {
  const baseMessages: Record<CareSuccessLevel, Record<string, string>> = {
    [CareSuccessLevel.EXCELLENT]: {
      [CareMetricType.HEALTH_SCORE]: "Your plant is thriving! Excellent care routine.",
      [CareMetricType.GROWTH_RATE]: "Outstanding growth! Your plant is developing beautifully.",
      [CareMetricType.CARE_FREQUENCY]: "Perfect care schedule! You're very consistent.",
      [CareMetricType.WATERING_CONSISTENCY]: "Excellent watering routine! Your plant loves it.",
      [CareMetricType.FERTILIZER_EFFECTIVENESS]: "Great fertilizing! Your plant is responding wonderfully.",
      [CareMetricType.SURVIVAL_RATE]: "Excellent plant survival rate! Outstanding care skills.",
      [CareMetricType.PROBLEM_RESOLUTION]: "Excellent problem resolution! You handle issues perfectly.",
      [CareMetricType.USER_SATISFACTION]: "Excellent satisfaction! You're enjoying your plant journey."
    },
    [CareSuccessLevel.GOOD]: {
      [CareMetricType.HEALTH_SCORE]: "Your plant is healthy and doing well!",
      [CareMetricType.GROWTH_RATE]: "Good growth progress. Keep up the great work!",
      [CareMetricType.CARE_FREQUENCY]: "Good care routine with room for small improvements.",
      [CareMetricType.WATERING_CONSISTENCY]: "Good watering habits. Minor adjustments could help.",
      [CareMetricType.FERTILIZER_EFFECTIVENESS]: "Fertilizing is working well for your plant.",
      [CareMetricType.SURVIVAL_RATE]: "Good plant survival rate. Most plants are thriving.",
      [CareMetricType.PROBLEM_RESOLUTION]: "Good problem resolution skills. Keep learning!",
      [CareMetricType.USER_SATISFACTION]: "Good satisfaction level. You're enjoying plant care."
    },
    [CareSuccessLevel.AVERAGE]: {
      [CareMetricType.HEALTH_SCORE]: "Plant health is average. Some improvements needed.",
      [CareMetricType.GROWTH_RATE]: "Growth is steady but could be improved.",
      [CareMetricType.CARE_FREQUENCY]: "Care routine needs some adjustments.",
      [CareMetricType.WATERING_CONSISTENCY]: "Watering schedule could be more consistent.",
      [CareMetricType.FERTILIZER_EFFECTIVENESS]: "Fertilizing routine needs optimization.",
      [CareMetricType.SURVIVAL_RATE]: "Average survival rate. Some plants need more attention.",
      [CareMetricType.PROBLEM_RESOLUTION]: "Problem resolution could improve with practice.",
      [CareMetricType.USER_SATISFACTION]: "Average satisfaction. Care routine needs adjustment."
    },
    [CareSuccessLevel.POOR]: {
      [CareMetricType.HEALTH_SCORE]: "Plant health needs attention. Changes required.",
      [CareMetricType.GROWTH_RATE]: "Growth is slow. Care routine needs improvement.",
      [CareMetricType.CARE_FREQUENCY]: "Care frequency is insufficient for optimal health.",
      [CareMetricType.WATERING_CONSISTENCY]: "Watering is inconsistent. Plant may be stressed.",
      [CareMetricType.FERTILIZER_EFFECTIVENESS]: "Current fertilizing approach isn't working well.",
      [CareMetricType.SURVIVAL_RATE]: "Poor survival rate. Many plants are struggling.",
      [CareMetricType.PROBLEM_RESOLUTION]: "Problem resolution needs significant improvement.",
      [CareMetricType.USER_SATISFACTION]: "Poor satisfaction. Consider changing your approach."
    },
    [CareSuccessLevel.CRITICAL]: {
      [CareMetricType.HEALTH_SCORE]: "Plant health is critical! Immediate action needed.",
      [CareMetricType.GROWTH_RATE]: "Growth has stopped. Urgent care changes required.",
      [CareMetricType.CARE_FREQUENCY]: "Critical care gaps detected. Plant at risk.",
      [CareMetricType.WATERING_CONSISTENCY]: "Severe watering issues. Plant may not survive.",
      [CareMetricType.FERTILIZER_EFFECTIVENESS]: "Fertilizing is harming the plant. Stop immediately.",
      [CareMetricType.SURVIVAL_RATE]: "Critical survival rate. Immediate intervention needed.",
      [CareMetricType.PROBLEM_RESOLUTION]: "Critical issues with problem resolution. Get help now.",
      [CareMetricType.USER_SATISFACTION]: "Critical satisfaction issues. Major changes needed."
    }
  };
  
  const levelMessages = baseMessages[this.successLevel as CareSuccessLevel];
  return levelMessages?.[this.metricType] || "Care analysis complete.";
};

// Method to get action items based on analysis
plantCareAnalyticsSchema.methods.getActionItems = function(): string[] {
  const actions = [];
  
  // Add specific actions based on success level and recommendations
  if (this.successLevel === CareSuccessLevel.CRITICAL || this.successLevel === CareSuccessLevel.POOR) {
    actions.push("Review and adjust your care routine immediately");
    actions.push("Check plant for signs of stress or disease");
  }
  
  if (this.trend.direction === 'declining') {
    actions.push("Monitor plant more closely for the next week");
    actions.push("Consider environmental factors that may have changed");
  }
  
  // Add recommendations from analysis
  if (this.analysisData.recommendations && this.analysisData.recommendations.length > 0) {
    actions.push(...this.analysisData.recommendations);
  }
  
  return actions.slice(0, 5); // Limit to 5 most important actions
};

// Method to calculate rank among similar plants
plantCareAnalyticsSchema.methods.calculateRank = async function(): Promise<number> {
  const plant = await mongoose.model('Plant').findById(this.plantId);
  if (!plant) return 50; // Default middle rank
  
  const betterCount = await mongoose.model('PlantCareAnalytics').countDocuments({
    metricType: this.metricType,
    value: { $gt: this.value },
    'plantDetails.category': plant.category
  });
  
  const totalCount = await mongoose.model('PlantCareAnalytics').countDocuments({
    metricType: this.metricType,
    'plantDetails.category': plant.category
  });
  
  if (totalCount === 0) return 50;
  
  return Math.round(((totalCount - betterCount) / totalCount) * 100);
};

// Static methods
plantCareAnalyticsSchema.statics.getPlantSummary = function(plantId: mongoose.Types.ObjectId) {
  return this.find({ 
    plantId,
    validUntil: { $gt: new Date() }
  }).sort({ calculatedAt: -1 });
};

plantCareAnalyticsSchema.statics.getUserSummary = function(userId: mongoose.Types.ObjectId) {
  return this.aggregate([
    {
      $match: {
        userId,
        validUntil: { $gt: new Date() }
      }
    },
    {
      $group: {
        _id: '$metricType',
        averageValue: { $avg: '$value' },
        plantsCount: { $sum: 1 },
        excellentCount: {
          $sum: { $cond: [{ $eq: ['$successLevel', CareSuccessLevel.EXCELLENT] }, 1, 0] }
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$successLevel', CareSuccessLevel.CRITICAL] }, 1, 0] }
        }
      }
    },
    {
      $sort: { averageValue: -1 }
    }
  ]);
};

plantCareAnalyticsSchema.statics.getTopPerformers = function(metricType: CareMetricType, limit: number = 10) {
  return this.find({
    metricType,
    validUntil: { $gt: new Date() }
  })
  .populate('plantDetails', 'name category species')
  .populate('userId', 'name')
  .sort({ value: -1 })
  .limit(limit);
};

plantCareAnalyticsSchema.statics.getTrendingMetrics = function() {
  return this.aggregate([
    {
      $match: {
        validUntil: { $gt: new Date() },
        'trend.direction': 'improving'
      }
    },
    {
      $group: {
        _id: '$metricType',
        averageImprovement: { $avg: '$trend.rate' },
        improvingPlantsCount: { $sum: 1 }
      }
    },
    {
      $sort: { averageImprovement: -1 }
    }
  ]);
};

// Create and export the model
export const PlantCareAnalytics = mongoose.model<IPlantCareAnalytics>('PlantCareAnalytics', plantCareAnalyticsSchema);