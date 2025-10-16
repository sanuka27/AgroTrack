import mongoose, { Schema, Document } from 'mongoose';

export type ReportKind = 'community' | 'bug';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  kind: ReportKind;
  reporterId?: mongoose.Types.ObjectId;
  postId?: mongoose.Types.ObjectId;
  severity?: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved' | 'dismissed';
  details: any;
  createdAt: Date;
  migratedAt: Date;
  source: string;
}

const ReportSchema = new Schema<IReport>({
  kind: {
    type: String,
    enum: ['community', 'bug'],
    required: true
  },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User' },
  postId: { type: Schema.Types.ObjectId, ref: 'Post' },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  details: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  migratedAt: { type: Date, default: Date.now },
  source: String
});

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ kind: 1, status: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);