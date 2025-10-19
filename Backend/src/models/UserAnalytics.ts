// STUB MODEL - Original UserAnalytics collection has been removed from database
// This is a placeholder to prevent build errors in legacy code

import mongoose, { Document, Schema, Model } from 'mongoose';

export enum AnalyticsEventType {
  ADMIN_ACTION = 'admin_action',
  ERROR = 'error',
  USER_ACTION = 'user_action',
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PLANT_ADDED = 'plant_added',
  PLANT_VIEWED = 'plant_viewed',
  PLANT_UPDATED = 'plant_updated',
  PLANT_DELETED = 'plant_deleted',
  PLANTS_BULK_OPERATION = 'plants_bulk_operation',
  PLANTS_IMPORTED = 'plants_imported',
  PLANTS_EXPORTED = 'plants_exported',
  CARE_LOG_CREATED = 'care_log_created',
  CARE_LOG_UPDATED = 'care_log_updated',
  CARE_LOG_DELETED = 'care_log_deleted',
  CARE_LOGS_BULK_OPERATION = 'care_logs_bulk_operation',
  REMINDER_CREATED = 'reminder_created',
  REMINDER_UPDATED = 'reminder_updated',
  REMINDER_DELETED = 'reminder_deleted',
  REMINDER_COMPLETED = 'reminder_completed',
  REMINDER_SNOOZED = 'reminder_snoozed',
  REMINDERS_BULK_OPERATION = 'reminders_bulk_operation',
  SMART_SCHEDULE_GENERATED = 'smart_schedule_generated',
  PROFILE_VIEWED = 'profile_viewed',
  PROFILE_UPDATED = 'profile_updated',
  PREFERENCES_UPDATED = 'preferences_updated',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_DELETED = 'account_deleted',
  ROLE_UPDATED = 'role_updated',
  USER_DELETED_BY_ADMIN = 'user_deleted_by_admin'
}

export interface IUserAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  eventType: AnalyticsEventType;
  eventData?: any;
  timestamp?: Date;
  community?: {
    postsCreated?: number;
    commentsPosted?: number;
    likesReceived?: number;
  };
}

interface IUserAnalyticsModel extends Model<IUserAnalytics> {
  trackEvent(userId: mongoose.Types.ObjectId | string, eventType: AnalyticsEventType, eventData?: any, metadata?: any): Promise<void>;
}

const userAnalyticsSchema = new Schema<IUserAnalytics>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  eventType: { type: String, enum: Object.values(AnalyticsEventType) },
  eventData: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  community: {
    postsCreated: { type: Number, default: 0 },
    commentsPosted: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 }
  }
}, { collection: 'useranalytics_deleted' });

// Static method stub
userAnalyticsSchema.statics.trackEvent = async function(
  userId: mongoose.Types.ObjectId | string, 
  eventType: AnalyticsEventType, 
  eventData?: any,
  metadata?: any
): Promise<void> {
  // Stub implementation - does nothing
  console.log(`[STUB] Analytics event tracked: ${eventType} for user ${userId}`);
};

export const UserAnalytics = mongoose.model<IUserAnalytics, IUserAnalyticsModel>('UserAnalytics', userAnalyticsSchema);
