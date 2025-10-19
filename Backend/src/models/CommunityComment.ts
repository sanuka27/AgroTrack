import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityComment extends Document {
  postId: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId; // Alias for postId
  authorId: mongoose.Types.ObjectId | null; // Changed from authorUid (string) to authorId (ObjectId)
  author: mongoose.Types.ObjectId | null; // Alias for authorId
  text: string; // Changed from bodyMarkdown
  body?: string; // Alias for text
  parentCommentId?: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId; // Alias
  status: 'visible' | 'hidden' | 'deleted'; // Changed from isDeleted (boolean)
  deletedAt?: Date;
  deletedBy?: string;
  editCount?: number;
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
    authorId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'User',
      index: true,
    },
    text: {
      type: String,
      required: false,
      default: '',
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['visible', 'hidden', 'deleted'],
      default: 'visible',
    },
    deletedAt: Date,
    deletedBy: String,
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'CommunityComment' },
    editCount: { type: Number, default: 0 }
  },
  {
    collection: 'comments',
    timestamps: true,
  }
);

// Compound indexes for performance
communityCommentSchema.index({ postId: 1, createdAt: -1 });
communityCommentSchema.index({ authorId: 1, createdAt: -1 });
communityCommentSchema.index({ postId: 1, status: 1, createdAt: -1 });

// Virtual properties for backward compatibility
communityCommentSchema.virtual('author').get(function () {
  return this.authorId;
});

communityCommentSchema.virtual('post').get(function () {
  return this.postId;
});

communityCommentSchema.virtual('body').get(function () {
  return this.text;
}).set(function (value: string) {
  this.text = value;
});

communityCommentSchema.virtual('parentComment').get(function () {
  return this.parentCommentId;
});

export const CommunityComment = mongoose.model<ICommunityComment>('CommunityComment', communityCommentSchema);
