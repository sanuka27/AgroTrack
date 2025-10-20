import mongoose, { Document, Schema } from 'mongoose';

export interface ICareLog extends Document {
  userId: mongoose.Types.ObjectId;
  plantId: mongoose.Types.ObjectId;
  careType: string;
  notes?: string;
  photos?: string[];
  careData?: Record<string, any>;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const careLogSchema = new Schema<ICareLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
  careType: { type: String, required: true },
  notes: { type: String },
  photos: [{ type: String }],
  careData: { type: Schema.Types.Mixed },
  date: { type: Date, default: Date.now }
}, {
  collection: 'carelogs',
  timestamps: true
});

careLogSchema.index({ userId: 1, plantId: 1, date: -1 });

export const CareLog = mongoose.model<ICareLog>('CareLog', careLogSchema);

export default CareLog;
