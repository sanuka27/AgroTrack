import mongoose, { Schema, Document } from 'mongoose';

// Care types matching frontend exactly
export type CareType = 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'health-check' | 'pest-treatment' | 'soil-change' | 'location-change';

// Interface for CareLog document
export interface ICareLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User who logged the care
  plantId: mongoose.Types.ObjectId; // Plant that received care
  careType: CareType;
  date: Date; // When the care was performed
  notes?: string;
  photos: string[]; // Array of image URLs
  metadata: CareMetadata;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

// Comprehensive metadata for different care types
export interface CareMetadata {
  // Watering specific fields
  waterAmount?: number; // ml
  wateringMethod?: 'spray' | 'bottom-watering' | 'top-watering' | 'soaking';
  waterType?: 'tap' | 'filtered' | 'distilled' | 'rainwater';
  soilMoisture?: 'dry' | 'slightly-dry' | 'moist' | 'wet';
  
  // Fertilizing specific fields
  fertilizerType?: string; // e.g., "Liquid fertilizer", "Granular"
  fertilizerBrand?: string;
  concentration?: string; // e.g., "half-strength", "quarter-strength", "full-strength"
  fertilizerApplicationMethod?: 'soil' | 'foliar' | 'slow-release' | 'liquid-feed';
  npkRatio?: string; // e.g., "10-10-10"
  
  // Pruning specific fields
  pruningType?: 'deadheading' | 'shaping' | 'maintenance' | 'propagation' | 'topping';
  partsRemoved?: string[]; // e.g., ['dead leaves', 'brown tips', 'flowers']
  toolsUsed?: string[]; // e.g., ['scissors', 'pruning shears', 'knife']
  amountRemoved?: 'light' | 'moderate' | 'heavy';
  
  // Repotting specific fields
  oldPotSize?: string; // e.g., "4 inch", "12cm"
  newPotSize?: string; // e.g., "6 inch", "15cm"
  soilType?: string; // e.g., "Potting mix", "Cactus soil"
  soilBrand?: string;
  rootCondition?: 'healthy' | 'root-bound' | 'root-rot' | 'needs-attention' | 'excellent';
  drainageAdded?: boolean;
  rootsPruned?: boolean;
  
  // Health check specific fields
  overallHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  symptoms?: string[]; // e.g., ['yellowing leaves', 'brown spots', 'wilting']
  improvements?: string[]; // e.g., ['new growth', 'greener leaves']
  measurements?: {
    height?: number; // cm
    width?: number; // cm
    leafCount?: number;
    flowerCount?: number;
  };
  
  // Pest treatment specific fields
  pestType?: string; // e.g., 'aphids', 'spider mites', 'fungus gnats'
  treatmentUsed?: string; // e.g., 'Neem oil', 'Insecticidal soap'
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  pestApplicationMethod?: 'spray' | 'soil-drench' | 'wipe-leaves' | 'systemic';
  treatmentFrequency?: string; // e.g., 'weekly', 'bi-weekly'
  
  // Soil change specific fields
  oldSoilType?: string;
  newSoilType?: string;
  soilCondition?: 'good' | 'compacted' | 'moldy' | 'depleted' | 'pest-infested';
  amendmentsAdded?: string[]; // e.g., ['perlite', 'bark chips', 'fertilizer']
  reasonForChange?: string;
  
  // Location change specific fields
  fromLocation?: string; // e.g., "Living room window"
  toLocation?: string; // e.g., "Bedroom corner"
  reason?: string; // e.g., 'more light', 'better humidity', 'seasonal move'
  lightChange?: 'more-light' | 'less-light' | 'same-light';
  temperatureChange?: 'warmer' | 'cooler' | 'same-temperature';
  
  // Environmental conditions at time of care
  environment?: {
    temperature?: number; // Celsius
    humidity?: number; // percentage
    lightLevel?: 'low' | 'medium' | 'high' | 'direct-sun';
    season?: 'spring' | 'summer' | 'fall' | 'winter';
  };
  
  // Time tracking
  timeSpent?: number; // minutes
  
  // Success tracking
  success?: boolean; // Was the care action successful?
  followUpNeeded?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

// CareLog schema definition
const careLogSchema = new Schema<ICareLog>({
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
  
  careType: {
    type: String,
    enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment', 'soil-change', 'location-change'],
    required: [true, 'Care type is required'],
    index: true
  },
  
  date: {
    type: Date,
    required: [true, 'Care date is required'],
    index: true,
    default: Date.now
  },
  
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    default: ''
  },
  
  photos: [{
    type: String,
    maxlength: [500, 'Photo URL cannot exceed 500 characters']
  }],
  
  metadata: {
    // Watering metadata
    waterAmount: {
      type: Number,
      min: [0, 'Water amount cannot be negative'],
      max: [10000, 'Water amount seems too high'] // 10 liters max
    },
    wateringMethod: {
      type: String,
      enum: ['spray', 'bottom-watering', 'top-watering', 'soaking']
    },
    waterType: {
      type: String,
      enum: ['tap', 'filtered', 'distilled', 'rainwater']
    },
    soilMoisture: {
      type: String,
      enum: ['dry', 'slightly-dry', 'moist', 'wet']
    },
    
    // Fertilizing metadata
    fertilizerType: {
      type: String,
      maxlength: [100, 'Fertilizer type cannot exceed 100 characters']
    },
    fertilizerBrand: {
      type: String,
      maxlength: [100, 'Fertilizer brand cannot exceed 100 characters']
    },
    concentration: {
      type: String,
      maxlength: [50, 'Concentration cannot exceed 50 characters']
    },
    fertilizerApplicationMethod: {
      type: String,
      enum: ['soil', 'foliar', 'slow-release', 'liquid-feed']
    },
    npkRatio: {
      type: String,
      maxlength: [20, 'NPK ratio cannot exceed 20 characters']
    },
    
    // Pruning metadata
    pruningType: {
      type: String,
      enum: ['deadheading', 'shaping', 'maintenance', 'propagation', 'topping']
    },
    partsRemoved: [{
      type: String,
      maxlength: [100, 'Part removed description cannot exceed 100 characters']
    }],
    toolsUsed: [{
      type: String,
      maxlength: [100, 'Tool name cannot exceed 100 characters']
    }],
    amountRemoved: {
      type: String,
      enum: ['light', 'moderate', 'heavy']
    },
    
    // Repotting metadata
    oldPotSize: {
      type: String,
      maxlength: [50, 'Old pot size cannot exceed 50 characters']
    },
    newPotSize: {
      type: String,
      maxlength: [50, 'New pot size cannot exceed 50 characters']
    },
    soilType: {
      type: String,
      maxlength: [100, 'Soil type cannot exceed 100 characters']
    },
    soilBrand: {
      type: String,
      maxlength: [100, 'Soil brand cannot exceed 100 characters']
    },
    rootCondition: {
      type: String,
      enum: ['healthy', 'root-bound', 'root-rot', 'needs-attention', 'excellent']
    },
    drainageAdded: {
      type: Boolean,
      default: false
    },
    rootsPruned: {
      type: Boolean,
      default: false
    },
    
    // Health check metadata
    overallHealth: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical']
    },
    symptoms: [{
      type: String,
      maxlength: [100, 'Symptom description cannot exceed 100 characters']
    }],
    improvements: [{
      type: String,
      maxlength: [100, 'Improvement description cannot exceed 100 characters']
    }],
    measurements: {
      height: {
        type: Number,
        min: [0, 'Height cannot be negative'],
        max: [10000, 'Height seems too high'] // 100 meters max
      },
      width: {
        type: Number,
        min: [0, 'Width cannot be negative'],
        max: [10000, 'Width seems too high']
      },
      leafCount: {
        type: Number,
        min: [0, 'Leaf count cannot be negative'],
        max: [100000, 'Leaf count seems too high']
      },
      flowerCount: {
        type: Number,
        min: [0, 'Flower count cannot be negative'],
        max: [10000, 'Flower count seems too high']
      }
    },
    
    // Pest treatment metadata
    pestType: {
      type: String,
      maxlength: [100, 'Pest type cannot exceed 100 characters']
    },
    treatmentUsed: {
      type: String,
      maxlength: [200, 'Treatment description cannot exceed 200 characters']
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'critical']
    },
    treatmentFrequency: {
      type: String,
      maxlength: [100, 'Treatment frequency cannot exceed 100 characters']
    },
    
    // Soil change metadata
    oldSoilType: {
      type: String,
      maxlength: [100, 'Old soil type cannot exceed 100 characters']
    },
    newSoilType: {
      type: String,
      maxlength: [100, 'New soil type cannot exceed 100 characters']
    },
    soilCondition: {
      type: String,
      enum: ['good', 'compacted', 'moldy', 'depleted', 'pest-infested']
    },
    amendmentsAdded: [{
      type: String,
      maxlength: [100, 'Amendment description cannot exceed 100 characters']
    }],
    reasonForChange: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    
    // Location change metadata
    fromLocation: {
      type: String,
      maxlength: [100, 'From location cannot exceed 100 characters']
    },
    toLocation: {
      type: String,
      maxlength: [100, 'To location cannot exceed 100 characters']
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    lightChange: {
      type: String,
      enum: ['more-light', 'less-light', 'same-light']
    },
    temperatureChange: {
      type: String,
      enum: ['warmer', 'cooler', 'same-temperature']
    },
    
    // Environmental conditions
    environment: {
      temperature: {
        type: Number,
        min: [-50, 'Temperature too low'],
        max: [70, 'Temperature too high'] // Celsius
      },
      humidity: {
        type: Number,
        min: [0, 'Humidity cannot be negative'],
        max: [100, 'Humidity cannot exceed 100%']
      },
      lightLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'direct-sun']
      },
      season: {
        type: String,
        enum: ['spring', 'summer', 'fall', 'winter']
      }
    },
    
    // Time and success tracking
    timeSpent: {
      type: Number,
      min: [0, 'Time spent cannot be negative'],
      max: [1440, 'Time spent cannot exceed 24 hours'] // minutes
    },
    success: {
      type: Boolean,
      default: true
    },
    followUpNeeded: {
      type: Boolean,
      default: false
    },
    followUpDate: {
      type: Date
    },
    followUpNotes: {
      type: String,
      maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
careLogSchema.index({ userId: 1, createdAt: -1 });
careLogSchema.index({ plantId: 1, createdAt: -1 });
careLogSchema.index({ userId: 1, plantId: 1, careType: 1 });
careLogSchema.index({ date: -1 });
careLogSchema.index({ careType: 1, date: -1 });
careLogSchema.index({ userId: 1, careType: 1, date: -1 });

// Virtual for days since care
careLogSchema.virtual('daysAgo').get(function(this: ICareLog) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to get care history for a plant
careLogSchema.statics.getPlantCareHistory = function(plantId: mongoose.Types.ObjectId, careType?: CareType, limit = 50) {
  const query: any = { plantId };
  if (careType) {
    query.careType = careType;
  }
  
  return this.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .populate('userId', 'name avatar')
    .populate('plantId', 'name imageUrl');
};

// Static method to get care statistics
careLogSchema.statics.getCareStatistics = function(userId: mongoose.Types.ObjectId, plantId?: mongoose.Types.ObjectId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchStage: any = {
    userId,
    date: { $gte: startDate }
  };
  
  if (plantId) {
    matchStage.plantId = plantId;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$careType',
        count: { $sum: 1 },
        lastCare: { $max: '$date' },
        avgTimeSpent: { $avg: '$metadata.timeSpent' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to find overdue care based on care logs
careLogSchema.statics.findOverdueCare = function(userId: mongoose.Types.ObjectId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return this.aggregate([
    {
      $match: {
        userId,
        careType: 'watering',
        date: { $lt: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: '$plantId',
        lastWatered: { $max: '$date' },
        careCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'plants',
        localField: '_id',
        foreignField: '_id',
        as: 'plant'
      }
    },
    {
      $match: {
        'plant.isActive': true
      }
    }
  ]);
};

// Pre-save middleware to update plant's last care dates
careLogSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Plant = mongoose.model('Plant');
      const updateData: any = {};
      
      // Update specific last care date based on care type
      switch (this.careType) {
        case 'watering':
          updateData.lastWatered = this.date;
          break;
        case 'fertilizing':
          updateData.lastFertilized = this.date;
          break;
        case 'repotting':
          updateData.lastRepotted = this.date;
          break;
      }
      
      if (Object.keys(updateData).length > 0) {
        await Plant.findByIdAndUpdate(this.plantId, updateData);
      }
    } catch (error) {
      console.error('Error updating plant care dates:', error);
    }
  }
  next();
});

// Create and export the model
export const CareLog = mongoose.model<ICareLog>('CareLog', careLogSchema);