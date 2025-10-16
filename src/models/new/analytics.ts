import mongoose, { Schema, Document } from 'mongoose';

export type AnalyticsType = 'user' | 'system' | 'dashboard' | 'search';

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  type: AnalyticsType;
  userId?: mongoose.Types.ObjectId;
  record: any; // Generic payload
  createdAt: Date;
  migratedAt: Date;
  source: string;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  type: {
    type: String,
    enum: ['user', 'system', 'dashboard', 'search'],
    required: true
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  record: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  migratedAt: { type: Date, default: Date.now },
  source: String
});

// Indexes
AnalyticsSchema.index({ type: 1, createdAt: -1 });
AnalyticsSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);