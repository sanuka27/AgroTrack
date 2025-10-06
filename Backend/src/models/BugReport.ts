import mongoose, { Document, Schema, Model } from 'mongoose';

// Bug Report Status
export enum BugReportStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// Bug Report Priority
export enum BugReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// BugReport interface
export interface IBugReport extends Document {
  // User information (optional - allow non-logged-in users)
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  
  // Bug details
  description: string;
  status: BugReportStatus;
  priority: BugReportPriority;
  
  // Assignment
  assignedTo?: mongoose.Types.ObjectId;
  
  // Attachments
  attachments?: string[];
  
  // Metadata
  userAgent?: string;
  browserInfo?: string;
  screenResolution?: string;
  
  // Timestamps
  createdAt: Date;
  resolvedAt?: Date;
  
  // Admin notes
  adminNotes?: string;
}

// BugReport schema
const bugReportSchema = new Schema<IBugReport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  description: {
    type: String,
    required: [true, 'Bug description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description must not exceed 2000 characters']
  },
  
  status: {
    type: String,
    enum: Object.values(BugReportStatus),
    default: BugReportStatus.NEW
  },
  
  priority: {
    type: String,
    enum: Object.values(BugReportPriority),
    default: BugReportPriority.MEDIUM
  },
  
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  attachments: [{
    type: String
  }],
  
  userAgent: String,
  browserInfo: String,
  screenResolution: String,
  
  resolvedAt: Date,
  adminNotes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
bugReportSchema.index({ status: 1, createdAt: -1 });
bugReportSchema.index({ priority: 1, status: 1 });
bugReportSchema.index({ assignedTo: 1 });
bugReportSchema.index({ userId: 1 });
bugReportSchema.index({ email: 1 });

// Virtual for formatted created date
bugReportSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Create and export model
export const BugReport = mongoose.model<IBugReport>('BugReport', bugReportSchema);
