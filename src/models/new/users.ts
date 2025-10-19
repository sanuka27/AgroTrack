import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firebaseUid?: string;
  email?: string;
  phone?: string;
  name?: string;
  roles: string[];
  sourceIds?: {
    legacyCommunityUser?: mongoose.Types.ObjectId;
    legacyUser?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
  migratedAt: Date;
  source: string;
}

const UserSchema = new Schema<IUser>({
  firebaseUid: { type: String, sparse: true },
  email: { type: String, sparse: true },
  phone: { type: String, sparse: true },
  name: String,
  roles: [{ type: String, enum: ['user', 'member', 'mod', 'moderator', 'admin', 'super_admin'] }],
  sourceIds: {
    legacyCommunityUser: { type: Schema.Types.ObjectId, ref: 'users' },
    legacyUser: { type: Schema.Types.ObjectId, ref: 'users' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  migratedAt: { type: Date, default: Date.now },
  source: String
}, {
  timestamps: true
});

// Compound index for deduplication
UserSchema.index({ email: 1, phone: 1 });
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ createdAt: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);