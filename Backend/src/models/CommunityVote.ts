import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityVote extends Document {
  postId: mongoose.Types.ObjectId;
  voterUid: string;
  value: 1 | -1; // Upvote or downvote
  createdAt: Date;
  updatedAt: Date;
}

const communityVoteSchema = new Schema<ICommunityVote>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'CommunityPost',
      index: true,
    },
    voterUid: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      enum: [1, -1],
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to ensure one vote per user per post
communityVoteSchema.index({ postId: 1, voterUid: 1 }, { unique: true });

// Additional indexes for queries
communityVoteSchema.index({ voterUid: 1, createdAt: -1 });
communityVoteSchema.index({ postId: 1, value: 1 });

export const CommunityVote = mongoose.model<ICommunityVote>('CommunityVote', communityVoteSchema);
