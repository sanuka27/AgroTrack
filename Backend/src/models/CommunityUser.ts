import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityUser extends Document {
  uid: string; // Firebase UID
  name: string;
  avatarUrl?: string;
  role: 'user' | 'mod' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const communityUserSchema = new Schema<ICommunityUser>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'mod', 'admin'],
      default: 'user',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
communityUserSchema.index({ uid: 1 });
communityUserSchema.index({ role: 1 });

export const CommunityUser = mongoose.model<ICommunityUser>('CommunityUser', communityUserSchema);
