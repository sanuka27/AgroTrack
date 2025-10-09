import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityComment extends Document {
  postId: mongoose.Types.ObjectId;
  authorUid: string;
  bodyMarkdown: string;
  isDeleted: boolean; // Soft delete
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityCommentSchema = new Schema<ICommunityComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'CommunityPost',
      index: true,
    },
    authorUid: {
      type: String,
      required: true,
      index: true,
    },
    bodyMarkdown: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
communityCommentSchema.index({ postId: 1, createdAt: -1 });
communityCommentSchema.index({ authorUid: 1, createdAt: -1 });
communityCommentSchema.index({ postId: 1, isDeleted: 1, createdAt: -1 });

export const CommunityComment = mongoose.model<ICommunityComment>('CommunityComment', communityCommentSchema);
