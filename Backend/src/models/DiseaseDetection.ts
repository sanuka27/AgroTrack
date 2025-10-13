import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDetectionResult {
  diseaseDetected: boolean;
  confidence: number;
  primaryDisease?: {
    name: string;
    scientificName?: string;
    category?: string;
    severity?: string;
    confidence?: number;
  } | null;
  alternativeDiagnoses?: any;
  healthyProbability?: number;
  processingTime?: number;
}

export interface IDiseaseDetection extends Document {
  userId: mongoose.Types.ObjectId;
  plantId?: mongoose.Types.ObjectId;
  imageUrl: string;
  originalFileName: string;
  detectionResults: IDetectionResult;
  treatmentRecommendations: any;
  plantInformation: any;
  expertVerification?: any;
  userFeedback?: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const DetectionResultSchema = new Schema<IDetectionResult>({
  diseaseDetected: { type: Boolean, default: false },
  confidence: { type: Number, default: 0 },
  primaryDisease: {
    name: String,
    scientificName: String,
    category: String,
    severity: String,
    confidence: Number
  },
  alternativeDiagnoses: { type: [Schema.Types.Mixed], default: [] },
  healthyProbability: { type: Number, default: 0 },
  processingTime: { type: Number, default: 0 }
});

const DiseaseDetectionSchema = new Schema<IDiseaseDetection>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plantId: { type: Schema.Types.ObjectId, ref: 'Plant' },
  imageUrl: { type: String, required: true },
  originalFileName: { type: String },
  detectionResults: { type: DetectionResultSchema, default: {} },
  treatmentRecommendations: { type: Schema.Types.Mixed, default: {} },
  plantInformation: { type: Schema.Types.Mixed, default: {} },
  expertVerification: { type: Schema.Types.Mixed },
  userFeedback: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['processing','completed','failed','expert-review'], default: 'processing' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Indexes for common queries
DiseaseDetectionSchema.index({ userId: 1, createdAt: -1 });
DiseaseDetectionSchema.index({ plantId: 1 });

export const DiseaseDetectionModel: Model<IDiseaseDetection> = mongoose.models.DiseaseDetection || mongoose.model<IDiseaseDetection>('DiseaseDetection', DiseaseDetectionSchema);

export default DiseaseDetectionModel;
