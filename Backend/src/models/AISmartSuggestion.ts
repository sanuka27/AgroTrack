// AI Smart Suggestions Model - Stores AI-generated personalized care tips
// Collection: ai_suggestions

import mongoose, { Document, Schema } from 'mongoose';

export type SuggestionType = 'pro_tip' | 'growth_insight' | 'alert' | 'care_reminder' | 'health_warning';

export interface IAISmartSuggestion extends Document {
  userId: mongoose.Types.ObjectId;
  plantId?: mongoose.Types.ObjectId;
  type: SuggestionType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number; // 0-1 scale
  
  // Analysis metadata
  analysisData: {
    healthScore?: number;
    growthRate?: number;
    lastWatered?: Date;
    lastFertilized?: Date;
    sunlightExposure?: string;
    soilMoisture?: string;
    temperature?: number;
    humidity?: number;
  };
  
  // AI metadata
  aiModel: string; // e.g., "gemini-pro"
  tokensUsed?: number;
  generatedAt: Date;
  
  // User interaction
  isRead: boolean;
  isDismissed: boolean;
  isActioned: boolean;
  actionedAt?: Date;
  
  // Validity
  expiresAt?: Date; // When this suggestion is no longer relevant
  
  createdAt: Date;
  updatedAt: Date;
}

const aiSmartSuggestionSchema = new Schema<IAISmartSuggestion>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  plantId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Plant',
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['pro_tip', 'growth_insight', 'alert', 'care_reminder', 'health_warning']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.5
  },
  analysisData: {
    healthScore: { type: Number, min: 0, max: 100 },
    growthRate: { type: Number },
    lastWatered: { type: Date },
    lastFertilized: { type: Date },
    sunlightExposure: { type: String },
    soilMoisture: { type: String },
    temperature: { type: Number },
    humidity: { type: Number }
  },
  aiModel: {
    type: String,
    required: true,
    default: 'gemini-pro'
  },
  tokensUsed: {
    type: Number,
    min: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  isActioned: {
    type: Boolean,
    default: false
  },
  actionedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, { 
  collection: 'ai_suggestions',
  timestamps: true 
});

// Indexes for better query performance
aiSmartSuggestionSchema.index({ userId: 1, createdAt: -1 });
aiSmartSuggestionSchema.index({ userId: 1, plantId: 1 });
aiSmartSuggestionSchema.index({ userId: 1, isRead: 1, isDismissed: 1 });
aiSmartSuggestionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const AISmartSuggestion = mongoose.model<IAISmartSuggestion>('AISmartSuggestion', aiSmartSuggestionSchema);
