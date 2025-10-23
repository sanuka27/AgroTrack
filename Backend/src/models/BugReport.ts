import mongoose, { Document, Schema } from 'mongoose';

export interface IBugReport extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  ipAddress?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BugReportSchema = new Schema<IBugReport>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  ipAddress: {
    type: String,
    maxlength: 45
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  collection: 'bugreports'
});

// Index for efficient querying
BugReportSchema.index({ status: 1, createdAt: -1 });
BugReportSchema.index({ email: 1 });
BugReportSchema.index({ priority: 1, status: 1 });

export const BugReport = mongoose.model<IBugReport>('BugReport', BugReportSchema);