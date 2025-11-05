import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'reminder' | 'alert' | 'tip' | 'system' | 'community' | 'expert' | 'admin_action';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['reminder','alert','tip','system','community','expert','admin_action'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  data: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false, index: true }
}, { collection: 'user_notifications', timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
