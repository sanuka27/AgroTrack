import mongoose, { Document, Schema, Model } from 'mongoose';

// Contact Message Status
export enum ContactMessageStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESPONDED = 'responded',
  CLOSED = 'closed'
}

// Contact Message Priority
export enum ContactMessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// ContactMessage interface
export interface IContactMessage extends Document {
  // User information (optional - allow non-logged-in users)
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  
  // Message details
  subject: string;
  message: string;
  status: ContactMessageStatus;
  priority: ContactMessagePriority;
  
  // Response
  response?: string;
  respondedAt?: Date;
  respondedBy?: mongoose.Types.ObjectId;
  
  // Attachments
  attachments?: string[];
  
  // Metadata
  userAgent?: string;
  ipAddress?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ContactMessage schema
const contactMessageSchema = new Schema<IContactMessage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'] // eslint-disable-line no-useless-escape
  },
  
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters'],
    maxlength: [200, 'Subject must not exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message must not exceed 2000 characters']
  },
  
  status: {
    type: String,
    enum: Object.values(ContactMessageStatus),
    default: ContactMessageStatus.NEW
  },
  
  priority: {
    type: String,
    enum: Object.values(ContactMessagePriority),
    default: ContactMessagePriority.MEDIUM
  },
  
  response: {
    type: String,
    maxlength: [2000, 'Response must not exceed 2000 characters']
  },
  
  respondedAt: Date,
  
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  attachments: [{
    type: String
  }],
  
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Indexes for efficient queries
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ priority: 1, status: 1 });
contactMessageSchema.index({ userId: 1 });
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ respondedBy: 1 });

// Virtual for formatted created date
contactMessageSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for response time (in hours)
contactMessageSchema.virtual('responseTimeHours').get(function() {
  if (!this.respondedAt) return null;
  const diff = this.respondedAt.getTime() - this.createdAt.getTime();
  return Math.round(diff / (1000 * 60 * 60));
});

// Create and export model
export const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
