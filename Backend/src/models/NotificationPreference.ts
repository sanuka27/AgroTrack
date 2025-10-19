// STUB MODEL - Original NotificationPreference collection has been removed from database
// This is a placeholder to prevent build errors in legacy code

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  emailAddress?: string;
  phoneNumber?: string;
  pushTokens?: string[];
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  isNotificationEnabled(type: string, channel: string): boolean;
  addPushToken(token: string): Promise<void>;
  removePushToken(token: string): Promise<void>;
}

interface INotificationPreferenceModel extends Model<INotificationPreference> {
  getOrCreateForUser(userId: string | mongoose.Types.ObjectId): Promise<INotificationPreference>;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  emailAddress: { type: String },
  phoneNumber: { type: String },
  pushTokens: [{ type: String }],
  email: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  sms: { type: Boolean, default: false }
}, { collection: 'notificationpreferences_deleted' });

// Instance method stubs
notificationPreferenceSchema.methods.isNotificationEnabled = function(type: string, channel: string): boolean {
  return true; // Stub: always return true
};

notificationPreferenceSchema.methods.addPushToken = async function(token: string): Promise<void> {
  if (!this.pushTokens) {
    this.pushTokens = [];
  }
  if (!this.pushTokens.includes(token)) {
    this.pushTokens.push(token);
    await this.save();
  }
};

notificationPreferenceSchema.methods.removePushToken = async function(token: string): Promise<void> {
  this.pushTokens = this.pushTokens?.filter((t: string) => t !== token) || [];
  await this.save();
};

// Static method stub
notificationPreferenceSchema.statics.getOrCreateForUser = async function(
  userId: string | mongoose.Types.ObjectId
): Promise<INotificationPreference> {
  let prefs = await this.findOne({ userId });
  if (!prefs) {
    prefs = await this.create({ userId });
  }
  return prefs;
};

export const NotificationPreference = mongoose.model<INotificationPreference, INotificationPreferenceModel>('NotificationPreference', notificationPreferenceSchema);
