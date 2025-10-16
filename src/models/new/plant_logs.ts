import mongoose, { Schema, Document } from 'mongoose';

export type PlantLogType = 'care' | 'analytics' | 'reminder';

export interface IPlantLog extends Document {
  _id: mongoose.Types.ObjectId;
  plantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: PlantLogType;
  details: any; // Flexible details object
  occurredAt: Date;
  migratedAt: Date;
  source: string;
}

const PlantLogSchema = new Schema<IPlantLog>({
  plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['care', 'analytics', 'reminder'],
    required: true
  },
  details: { type: Schema.Types.Mixed, required: true },
  occurredAt: { type: Date, required: true },
  migratedAt: { type: Date, default: Date.now },
  source: String
});

// Indexes
PlantLogSchema.index({ plantId: 1, occurredAt: -1 });
PlantLogSchema.index({ userId: 1, type: 1, occurredAt: -1 });

export const PlantLog = mongoose.model<IPlantLog>('PlantLog', PlantLogSchema);