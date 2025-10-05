import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'reminder' | 'alert' | 'tip' | 'community' | 'expert' | 'system';
  title: string;
  message: string;
  channels: ('email' | 'push' | 'sms')[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  relatedEntity?: {
    type: 'plant' | 'reminder' | 'post' | 'consultation' | 'weather';
    id: mongoose.Types.ObjectId;
  };
  metadata: {
    plantId?: mongoose.Types.ObjectId;
    plantName?: string;
    careType?: string;
    weatherCondition?: string;
    location?: string;
    aiGenerated?: boolean;
    retryCount?: number;
    failureReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'alert', 'tip', 'community', 'expert', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  channels: [{
    type: String,
    enum: ['email', 'push', 'sms'],
    required: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['plant', 'reminder', 'post', 'consultation', 'weather']
    },
    id: Schema.Types.ObjectId
  },
  metadata: {
    plantId: {
      type: Schema.Types.ObjectId,
      ref: 'Plant'
    },
    plantName: String,
    careType: String,
    weatherCondition: String,
    location: String,
    aiGenerated: {
      type: Boolean,
      default: false
    },
    retryCount: {
      type: Number,
      default: 0
    },
    failureReason: String
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });

// ✅ Duplicate index removed to avoid Mongoose warning

// Extend interface for instance methods
interface INotificationMethods {
  markAsRead(): Promise<INotification>;
}

// Extend interface for static methods
interface INotificationModel extends mongoose.Model<INotification, {}, INotificationMethods> {
  getUnreadCount(userId: mongoose.Types.ObjectId): Promise<number>;
  getUserNotifications(
    userId: mongoose.Types.ObjectId, 
    page?: number, 
    limit?: number,
    filter?: any
  ): Promise<INotification[]>;
}

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId: mongoose.Types.ObjectId) {
  return this.countDocuments({ 
    userId, 
    status: { $in: ['sent', 'delivered'] }
  });
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getUserNotifications = function(
  userId: mongoose.Types.ObjectId, 
  page: number = 1, 
  limit: number = 20,
  filter: any = {}
) {
  const skip = (page - 1) * limit;
  const query = { userId, ...filter };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('relatedEntity.id', 'name species')
    .lean();
};

export const Notification = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);