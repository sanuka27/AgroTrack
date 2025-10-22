// REAL PLANT MODEL - Stores user's plant collection data
// Collection: plants

import mongoose, { Document, Schema } from 'mongoose';

export interface IPlant extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  species?: string;
  category?: string;
  scientificName?: string;
  commonNames?: string[];
  plantedDate?: Date;
  ageYears?: number;
  location?: string;
  notes?: string;
  imageUrl?: string;
  
  // Care Instructions
  careInstructions?: {
    watering?: string;
    fertilizing?: string;
    pruning?: string;
    sunlight?: string;
    soilType?: string;
  };
  
  // Watering & Fertilizing Schedule
  wateringFrequency?: number; // days
  wateringEveryDays?: number; // days
  fertilizerEveryWeeks?: number; // weeks
  lastWateredDate?: Date;
  lastFertilizedDate?: Date;
  
  // Sunlight Requirements
  sunlightRequirements?: string; // e.g., "Full Sun", "Partial Shade"
  
  // Soil Type
  soilType?: string;
  
  // Health & Growth
  healthStatus?: string; // e.g., "Good", "Fair", "Poor"
  health?: string;
  healthScore?: number;
  // growth rate removed
  
  // Measurements & Tracking
  measurements?: Array<{
    height?: number;
    width?: number;
    recordedAt: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const plantSchema = new Schema<IPlant>({
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
  species: { 
    type: String,
    trim: true 
  },
  category: { 
    type: String,
    trim: true,
    enum: ['Indoor', 'Outdoor', 'Succulent', 'Herb', 'Vegetable', 'Flower', 'Tree', 'Shrub', 'Other']
  },
  scientificName: { 
    type: String,
    trim: true 
  },
  commonNames: [{ 
    type: String,
    trim: true 
  }],
  plantedDate: { 
    type: Date,
    default: Date.now
  },
  ageYears: {
    type: Number,
    min: 0
  },
  location: { 
    type: String,
    trim: true 
  },
  notes: { 
    type: String,
    maxlength: 2000
  },
  imageUrl: { 
    type: String 
  },
  
  // Care Instructions
  careInstructions: {
    watering: { type: String },
    fertilizing: { type: String },
    pruning: { type: String },
    sunlight: { type: String },
    soilType: { type: String }
  },
  
  // Watering & Fertilizing Schedule
  wateringFrequency: { 
    type: Number,
    min: 1,
    max: 365
  },
  wateringEveryDays: { 
    type: Number,
    min: 1,
    max: 365
  },
  fertilizerEveryWeeks: { 
    type: Number,
    min: 1,
    max: 52
  },
  lastWateredDate: { 
    type: Date 
  },
  lastFertilizedDate: { 
    type: Date 
  },
  
  // Sunlight Requirements
  sunlightRequirements: {
    type: String,
    enum: ['Full Sun', 'Partial Sun', 'Partial Shade', 'Full Shade', 'Indirect Light']
  },
  
  // Soil Type
  soilType: {
    type: String
  },
  
  // Health & Growth
  healthStatus: { 
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    default: 'Good'
  },
  health: { 
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical']
  },
  healthScore: { 
    type: Number,
    min: 0,
    max: 100
  },
  // growthRate removed from schema
  
  // Measurements & Tracking
  measurements: [{
    height: { type: Number },
    width: { type: Number },
    recordedAt: { type: Date, default: Date.now }
  }]
}, { 
  collection: 'plants',
  timestamps: true 
});

// Indexes for better query performance
plantSchema.index({ userId: 1, createdAt: -1 });
plantSchema.index({ userId: 1, category: 1 });
plantSchema.index({ userId: 1, healthStatus: 1 });

export const Plant = mongoose.model<IPlant>('Plant', plantSchema);
