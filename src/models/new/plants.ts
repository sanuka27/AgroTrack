import mongoose, { Schema, Document } from 'mongoose';

// Plant enums
export type Sunlight = 'Full Sun' | 'Partial Sun' | 'Low Light' | 'Shade';
export type Category = 'Indoor' | 'Outdoor' | 'Succulent' | 'Herb' | 'Flower' | 'Tree';
export type Health = 'Excellent' | 'Good' | 'Needs light' | 'Needs water' | 'Attention';

// Interface for Plant document
export interface IPlant extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Basic info
  name: string;
  category: Category;
  sunlight: Sunlight;
  health: Health;
  healthScore?: number;

  // Care schedule
  wateringEveryDays: number;
  fertilizerEveryWeeks?: number;

  // Plant details
  ageYears?: number;
  soil?: string;
  notes?: string;

  // Images
  imageUrl?: string;
  images: string[];

  // Care tracking
  lastWatered?: Date;
  lastFertilized?: Date;
  lastRepotted?: Date;

  // Growth tracking
  measurements: {
    height?: number;
    width?: number;
    leafCount?: number;
    recordedAt: Date;
  }[];

  // Location and environment
  location?: string;
  lightConditions?: string;
  humidity?: number;
  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };

  // Plant information
  species?: string;
  scientificName?: string;
  commonNames: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  toxicity?: 'Pet Safe' | 'Toxic to Pets' | 'Toxic to Humans' | 'Unknown';
  origin?: string;

  // Care preferences
  carePreferences: {
    watering: {
      method: 'top-watering' | 'bottom-watering' | 'soaking' | 'spray';
      amount?: number;
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

  // Status
  isActive: boolean;
  acquiredDate?: Date;
  source?: string;
  cost?: number;

  // AI insights
  aiInsights: {
    healthAnalysis?: string;
    recommendations: string[];
    lastAnalyzed?: Date;
  };

  // Social
  isPublic: boolean;
  tags: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Plant schema
const PlantSchema = new Schema<IPlant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  category: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'Succulent', 'Herb', 'Flower', 'Tree'],
    required: true
  },

  sunlight: {
    type: String,
    enum: ['Full Sun', 'Partial Sun', 'Low Light', 'Shade'],
    required: true,
    index: true
  },

  health: {
    type: String,
    enum: ['Excellent', 'Good', 'Needs light', 'Needs water', 'Attention'],
    default: 'Good'
  },

  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },

  wateringEveryDays: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
    default: 7
  },

  fertilizerEveryWeeks: {
    type: Number,
    min: 1,
    max: 52
  },

  ageYears: {
    type: Number,
    min: 0,
    max: 100
  },

  soil: {
    type: String,
    maxlength: 200
  },

  notes: {
    type: String,
    maxlength: 1000
  },

  imageUrl: String,

  images: [{
    type: String
  }],

  lastWatered: Date,
  lastFertilized: Date,
  lastRepotted: Date,

  measurements: [{
    height: Number,
    width: Number,
    leafCount: Number,
    recordedAt: {
      type: Date,
      default: Date.now
    }
  }],

  location: String,
  lightConditions: String,
  humidity: Number,

  temperature: {
    min: Number,
    max: Number,
    unit: {
      type: String,
      enum: ['C', 'F'],
      default: 'C'
    }
  },

  species: String,
  scientificName: String,

  commonNames: [{
    type: String
  }],

  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },

  toxicity: {
    type: String,
    enum: ['Pet Safe', 'Toxic to Pets', 'Toxic to Humans', 'Unknown']
  },

  origin: String,

  carePreferences: {
    watering: {
      method: {
        type: String,
        enum: ['top-watering', 'bottom-watering', 'soaking', 'spray'],
        default: 'top-watering'
      },
      amount: Number,
      waterType: {
        type: String,
        enum: ['tap', 'filtered', 'distilled', 'rainwater']
      }
    },
    fertilizing: {
      type: String,
      concentration: {
        type: String,
        enum: ['full-strength', 'half-strength', 'quarter-strength']
      },
      season: {
        type: String,
        enum: ['spring-summer', 'year-round', 'growing-season']
      }
    },
    pruning: {
      frequency: {
        type: String,
        enum: ['monthly', 'seasonal', 'as-needed']
      },
      type: {
        type: String,
        enum: ['deadheading', 'shaping', 'maintenance', 'propagation']
      }
    }
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  acquiredDate: Date,
  source: String,
  cost: Number,

  aiInsights: {
    healthAnalysis: String,
    recommendations: [{
      type: String
    }],
    lastAnalyzed: Date
  },

  isPublic: {
    type: Boolean,
    default: false
  },

  tags: [{
    type: String,
    index: true
  }]

}, {
  timestamps: true
});

// Indexes
PlantSchema.index({ userId: 1, isActive: 1 });
PlantSchema.index({ category: 1 });
PlantSchema.index({ difficulty: 1 });
PlantSchema.index({ tags: 1 });
PlantSchema.index({ createdAt: -1 });

export const Plant = mongoose.model<IPlant>('Plant', PlantSchema);