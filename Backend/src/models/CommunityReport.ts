import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityReport extends Document {
  reporterUid: string;
  targetType: 'post' | 'comment';
  targetId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityReportSchema = new Schema<ICommunityReport>(
  {
    reporterUid: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['post', 'comment'],
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'spam',
        'harassment',
        'inappropriate-content',
        'misinformation',
        'off-topic',
        'duplicate',
        'other',
      ],
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    collection: 'reports',
    timestamps: true,
  }
);

// Indexes for moderation queries
communityReportSchema.index({ status: 1, createdAt: -1 });
communityReportSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
communityReportSchema.index({ reporterUid: 1, createdAt: -1 });

export const CommunityReport = mongoose.model<ICommunityReport>('CommunityReport', communityReportSchema);
