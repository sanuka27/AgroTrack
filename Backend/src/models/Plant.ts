import mongoose, { Schema, Document } from 'mongoose';

// Plant enums matching frontend types
export type Sunlight = 'Full Sun' | 'Partial Sun' | 'Low Light' | 'Shade';
export type Category = 'Indoor' | 'Outdoor' | 'Succulent' | 'Herb' | 'Flower' | 'Tree';
export type Health = 'Excellent' | 'Good' | 'Needs light' | 'Needs water' | 'Attention';

// Interface for Plant document
export interface IPlant extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Owner of the plant
  
  // Virtual properties
  daysSinceLastWatered?: number | null;
  wateringStatus?: 'unknown' | 'overdue' | 'due' | 'soon' | 'good';
  nextWateringDate?: Date | null;
  name: string;
  category: Category;
  sunlight: Sunlight;
  health: Health;
  healthStatus?: Health; // Alias for health for controller compatibility
  healthScore?: number; // Numeric health score for analytics
  
  // Care schedule
  wateringEveryDays: number;
  fertilizerEveryWeeks?: number;
  
  // Plant details
  ageYears?: number;
  soil?: string;
  notes?: string;
  
  // Images
  imageUrl?: string; // Main plant image
  images: string[]; // Additional images
  
  // Care tracking
  lastWatered?: Date;
  lastFertilized?: Date;
  lastRepotted?: Date;
  
  // Growth tracking
  growthRatePctThisMonth?: number;
  measurements: {
    height?: number; // in cm
    width?: number; // in cm
    leafCount?: number;
    recordedAt: Date;
  }[];
  
  // Location and environment
  location?: string; // e.g., "Living room", "Garden", "Balcony"
  lightConditions?: string;
  humidity?: number; // percentage
  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  
  // Plant information
  species?: string; // Plant species for controllers compatibility
  scientificName?: string;
  commonNames: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  toxicity?: 'Pet Safe' | 'Toxic to Pets' | 'Toxic to Humans' | 'Unknown';
  origin?: string;
  
  // Care preferences (customizable per plant)
  carePreferences: {
    watering: {
      method: 'top-watering' | 'bottom-watering' | 'soaking' | 'spray';
      amount?: number; // ml
      waterType?: 'tap' | 'filtered' | 'distilled' | 'rainwater';
    };
    fertilizing: {
      type?: string;
      concentration?: 'full-strength' | 'half-strength' | 'quarter-strength';
      season?: 'spring-summer' | 'year-round' | 'growing-season';
    };
    pruning: {
      frequency?: 'monthly' | 'seasonal' | 'as-needed';
      type?: 'deadheading' | 'shaping' | 'maintenance' | 'propagation';
    };
  };
  
  // Care instructions for controller compatibility
  careInstructions?: {
    [careType: string]: {
      frequency?: number;
      amount?: string;
      method?: string;
      notes?: string;
      type?: string;
      hours?: number;
      season?: string;
      min?: number;
      max?: number;
      optimal?: number;
    };
  };
  
  // Status and tracking
  isActive: boolean; // False if plant is no longer being cared for
  acquiredDate?: Date;
  source?: string; // Where the plant came from
  cost?: number;
  
  // AI and automation
  aiInsights: {
    healthAnalysis?: string;
    recommendations: string[];
    lastAnalyzed?: Date;
  };
  
  // Social features
  isPublic: boolean; // Whether to show in community
  tags: string[]; // User-defined tags for organization
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Plant schema definition
const plantSchema = new Schema<IPlant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Plant must belong to a user']
  },
  
  name: {
    type: String,
    required: [true, 'Plant name is required'],
    trim: true,
    maxlength: [100, 'Plant name cannot exceed 100 characters']
  },
  
  category: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'Succulent', 'Herb', 'Flower', 'Tree'],
    required: [true, 'Plant category is required']
  },
  
  sunlight: {
    type: String,
    enum: ['Full Sun', 'Partial Sun', 'Low Light', 'Shade'],
    required: [true, 'Sunlight requirement is required'],
    index: true
  },
  
  health: {
    type: String,
    enum: ['Excellent', 'Good', 'Needs light', 'Needs water', 'Attention'],
    default: 'Good'
  },
  
  healthStatus: {
    type: String,
    enum: ['Excellent', 'Good', 'Needs light', 'Needs water', 'Attention'],
    default: 'Good',
    index: true
  },
  
  healthScore: {
    type: Number,
    min: [0, 'Health score cannot be negative'],
    max: [100, 'Health score cannot exceed 100'],
    default: 75
  },
  
  // Care schedule
  wateringEveryDays: {
    type: Number,
    required: [true, 'Watering frequency is required'],
    min: [1, 'Watering frequency must be at least 1 day'],
    max: [365, 'Watering frequency cannot exceed 365 days'],
    default: 7
  },
  
  fertilizerEveryWeeks: {
    type: Number,
    min: [1, 'Fertilizer frequency must be at least 1 week'],
    max: [52, 'Fertilizer frequency cannot exceed 52 weeks'],
    default: null
  },
  
  // Plant details
  ageYears: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [100, 'Age cannot exceed 100 years'],
    default: null
  },
  
  soil: {
    type: String,
    maxlength: [200, 'Soil description cannot exceed 200 characters'],
    default: ''
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  
  // Images
  imageUrl: {
    type: String,
    default: null
  },
  
  images: [{
    type: String
  }],
  
  // Care tracking
  lastWatered: {
    type: Date,
    default: null,
    index: true
  },
  
  lastFertilized: {
    type: Date,
    default: null,
    index: true
  },
  
  lastRepotted: {
    type: Date,
    default: null
  },
  
  // Growth tracking
  growthRatePctThisMonth: {
    type: Number,
    min: [-100, 'Growth rate cannot be less than -100%'],
    max: [1000, 'Growth rate cannot exceed 1000%'],
    default: 0
  },
  
  measurements: [{
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    leafCount: {
      type: Number,
      min: [0, 'Leaf count cannot be negative']
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  
  // Location and environment
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  
  lightConditions: {
    type: String,
    maxlength: [200, 'Light conditions cannot exceed 200 characters'],
    default: ''
  },
  
  humidity: {
    type: Number,
    min: [0, 'Humidity cannot be negative'],
    max: [100, 'Humidity cannot exceed 100%'],
    default: null
  },
  
  temperature: {
    min: {
      type: Number,
      required: function(this: any) { return this.temperature; }
    },
    max: {
      type: Number,
      required: function(this: any) { return this.temperature; }
    },
    unit: {
      type: String,
      enum: ['C', 'F'],
      required: function(this: any) { return this.temperature; }
    }
  },
  
  // Plant information
  species: {
    type: String,
    maxlength: [200, 'Species cannot exceed 200 characters'],
    default: ''
  },
  
  scientificName: {
    type: String,
    maxlength: [200, 'Scientific name cannot exceed 200 characters'],
    default: ''
  },
  
  commonNames: [{
    type: String,
    maxlength: [100, 'Common name cannot exceed 100 characters']
  }],
  
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  
  toxicity: {
    type: String,
    enum: ['Pet Safe', 'Toxic to Pets', 'Toxic to Humans', 'Unknown'],
    default: 'Unknown'
  },
  
  origin: {
    type: String,
    maxlength: [200, 'Origin cannot exceed 200 characters'],
    default: ''
  },
  
  // Care preferences
  carePreferences: {
    watering: {
      method: {
        type: String,
        enum: ['top-watering', 'bottom-watering', 'soaking', 'spray'],
        default: 'top-watering'
      },
      amount: {
        type: Number,
        min: [0, 'Water amount cannot be negative'],
        default: null
      },
      waterType: {
        type: String,
        enum: ['tap', 'filtered', 'distilled', 'rainwater'],
        default: 'tap'
      }
    },
    fertilizing: {
      type: {
        type: String,
        maxlength: [100, 'Fertilizer type cannot exceed 100 characters'],
        default: ''
      },
      concentration: {
        type: String,
        enum: ['full-strength', 'half-strength', 'quarter-strength'],
        default: 'half-strength'
      },
      season: {
        type: String,
        enum: ['spring-summer', 'year-round', 'growing-season'],
        default: 'spring-summer'
      }
    },
    pruning: {
      frequency: {
        type: String,
        enum: ['monthly', 'seasonal', 'as-needed'],
        default: 'as-needed'
      },
      type: {
        type: String,
        enum: ['deadheading', 'shaping', 'maintenance', 'propagation'],
        default: 'maintenance'
      }
    }
  },
  
  // Status and tracking
  isActive: {
    type: Boolean,
    default: true
  },
  
  acquiredDate: {
    type: Date,
    default: null
  },
  
  source: {
    type: String,
    maxlength: [200, 'Source cannot exceed 200 characters'],
    default: ''
  },
  
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: null
  },
  
  // AI and automation
  aiInsights: {
    healthAnalysis: {
      type: String,
      maxlength: [1000, 'Health analysis cannot exceed 1000 characters'],
      default: ''
    },
    recommendations: [{
      type: String,
      maxlength: [500, 'Recommendation cannot exceed 500 characters']
    }],
    lastAnalyzed: {
      type: Date,
      default: null
    }
  },
  
  // Social features
  isPublic: {
    type: Boolean,
    default: false
  },
  
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Care instructions for controller compatibility
  careInstructions: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
plantSchema.index({ userId: 1, createdAt: -1 });
plantSchema.index({ userId: 1, category: 1 });
plantSchema.index({ userId: 1, health: 1 });
plantSchema.index({ userId: 1, isActive: 1 });
plantSchema.index({ name: 'text', scientificName: 'text', commonNames: 'text' });
plantSchema.index({ tags: 1 });
plantSchema.index({ isPublic: 1, createdAt: -1 });

// ✅ Duplicate index removed to avoid Mongoose warning

// Virtual for days since last watered
plantSchema.virtual('daysSinceLastWatered').get(function(this: IPlant) {
  if (!this.lastWatered) return null;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.lastWatered.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for watering status
plantSchema.virtual('wateringStatus').get(function(this: IPlant) {
  const daysSince = this.daysSinceLastWatered;
  if (daysSince === null || daysSince === undefined) return 'unknown';
  
  if (daysSince > this.wateringEveryDays + 2) return 'overdue';
  if (daysSince > this.wateringEveryDays) return 'due';
  if (daysSince >= this.wateringEveryDays - 1) return 'soon';
  return 'good';
});

// Virtual for next watering date
plantSchema.virtual('nextWateringDate').get(function(this: IPlant) {
  if (!this.lastWatered) return null;
  const nextDate = new Date(this.lastWatered);
  nextDate.setDate(nextDate.getDate() + this.wateringEveryDays);
  return nextDate;
});

// Method to add measurement
plantSchema.methods.addMeasurement = function(measurement: {
  height?: number;
  width?: number;
  leafCount?: number;
}) {
  this.measurements.push({
    ...measurement,
    recordedAt: new Date()
  });
  
  // Keep only last 50 measurements
  if (this.measurements.length > 50) {
    this.measurements = this.measurements.slice(-50);
  }
};

// Method to update health based on care history
plantSchema.methods.updateHealthScore = function() {
  const daysSinceWatered = this.daysSinceLastWatered;
  
  if (daysSinceWatered === null) {
    this.health = 'Good';
    return;
  }
  
  if (daysSinceWatered > this.wateringEveryDays + 7) {
    this.health = 'Needs water';
  } else if (daysSinceWatered > this.wateringEveryDays + 3) {
    this.health = 'Attention';
  } else if (daysSinceWatered <= this.wateringEveryDays) {
    this.health = 'Good';
  } else {
    this.health = 'Excellent';
  }
};

// Static method to find plants needing care
plantSchema.statics.findNeedingCare = function(userId: mongoose.Types.ObjectId) {
  const today = new Date();
  const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
  
  return this.find({
    userId,
    isActive: true,
    $or: [
      { lastWatered: { $lte: threeDaysAgo } },
      { lastWatered: null }
    ]
  }).sort({ createdAt: -1 });
};

// Create and export the model
export const Plant = mongoose.model<IPlant>('Plant', plantSchema);