import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAIRecommendation extends Document {
  userId?: Types.ObjectId | null;
  plantId?: Types.ObjectId | null;
  plantName?: string | null;
  imageUrl: string;
  imageStoragePath?: string | null;
  originalFileName?: string;
  description?: string | null;
  selectedSymptoms?: string[];
  detectionResults: {
    diseaseDetected: boolean;
    confidence: number;
    primaryDisease?: {
      name: string;
      scientificName?: string;
      category?: string;
      severity?: 'mild' | 'moderate' | 'severe' | 'critical';
      confidence?: number;
    };
    alternativeDiagnoses?: Array<{
      name: string;
      scientificName?: string;
      confidence: number;
      category?: string;
    }>;
    healthyProbability?: number;
    processingTime?: number;
  };
  recommendations: {
    immediateActions: string[];
    treatments: Array<{
      type: 'chemical' | 'organic' | 'cultural' | 'biological';
      name: string;
      description?: string;
      applicationMethod?: string;
      frequency?: string;
      duration?: string;
      effectiveness?: number;
      cost?: 'low' | 'medium' | 'high';
    }>;
    preventionMeasures: string[];
    followUpRequired: boolean;
    followUpDays: number;
    quarantineRecommended: boolean;
  };
  plantInformation?: {
    affectedParts?: string[];
    symptoms?: string[];
    progressionStage?: 'early' | 'intermediate' | 'advanced' | 'unknown';
    spreadRisk?: 'low' | 'medium' | 'high';
    environmentalFactors?: {
      humidity?: number;
      temperature?: number;
      lightConditions?: string;
      airCirculation?: string;
    };
  };
  status: 'processing' | 'completed' | 'failed' | 'expert-review';
  createdAt: Date;
  updatedAt: Date;
}

const AIRecommendationSchema = new Schema<IAIRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant', default: null, index: true },
    plantName: { type: String, default: null },
    imageUrl: { type: String, required: true },
    imageStoragePath: { type: String, default: null },
    originalFileName: { type: String },
  description: { type: String, default: null },
  selectedSymptoms: [{ type: String }],
    detectionResults: {
      diseaseDetected: { type: Boolean, required: true },
      confidence: { type: Number, required: true },
      primaryDisease: {
        name: { type: String },
        scientificName: { type: String },
        category: { type: String },
        severity: { type: String, enum: ['mild', 'moderate', 'severe', 'critical'] },
        confidence: { type: Number }
      },
      alternativeDiagnoses: [
        {
          name: { type: String, required: true },
          scientificName: { type: String },
          confidence: { type: Number, required: true },
          category: { type: String }
        }
      ],
      healthyProbability: { type: Number },
      processingTime: { type: Number }
    },
    recommendations: {
      immediateActions: [{ type: String }],
      treatments: [
        {
          type: { type: String, enum: ['chemical', 'organic', 'cultural', 'biological'] },
          name: { type: String, required: true },
          description: { type: String },
          applicationMethod: { type: String },
          frequency: { type: String },
          duration: { type: String },
          effectiveness: { type: Number },
          cost: { type: String, enum: ['low', 'medium', 'high'] }
        }
      ],
      preventionMeasures: [{ type: String }],
      followUpRequired: { type: Boolean, default: false },
      followUpDays: { type: Number, default: 7 },
      quarantineRecommended: { type: Boolean, default: false }
    },
    plantInformation: {
      affectedParts: [{ type: String }],
      symptoms: [{ type: String }],
      progressionStage: { type: String, enum: ['early', 'intermediate', 'advanced', 'unknown'] },
      spreadRisk: { type: String, enum: ['low', 'medium', 'high'] },
      environmentalFactors: {
        humidity: { type: Number },
        temperature: { type: Number },
        lightConditions: { type: String },
        airCirculation: { type: String }
      }
    },
    status: { type: String, enum: ['processing', 'completed', 'failed', 'expert-review'], default: 'completed' }
  },
  {
    timestamps: true,
    collection: 'ai_recommendations'
  }
);

AIRecommendationSchema.index({ userId: 1, createdAt: -1 });
AIRecommendationSchema.index({ plantId: 1, createdAt: -1 });

export const AIRecommendation = mongoose.models.AIRecommendation || mongoose.model<IAIRecommendation>('AIRecommendation', AIRecommendationSchema);
