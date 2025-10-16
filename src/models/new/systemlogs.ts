import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: string;
  actorId?: mongoose.Types.ObjectId;
  payload: any;
  createdAt: Date;
  migratedAt: Date;
  source: string;
}

const SystemLogSchema = new Schema<ISystemLog>({
  action: { type: String, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  payload: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  migratedAt: { type: Date, default: Date.now },
  source: String
});

// Indexes
SystemLogSchema.index({ action: 1, createdAt: -1 });
SystemLogSchema.index({ actorId: 1, createdAt: -1 });

export const SystemLog = mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);