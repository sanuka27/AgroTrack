import mongoose, { Document, Schema } from 'mongoose';

// Embedded Comment Interface
export interface IEmbeddedComment {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  body: string;
  parentCommentId?: mongoose.Types.ObjectId;
  upvotes: number;
  downvotes: number;
  isExpertReply: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityPost extends Document {
  authorId: mongoose.Types.ObjectId; // Changed from authorUid (string) to authorId (ObjectId)
  author: mongoose.Types.ObjectId; // Alias for authorId (backward compatibility)
  authorName: string; // Display name of the author
  authorUsername?: string; // Optional username of the author
  title: string;
  body: string; // Changed from bodyMarkdown
  content?: string; // Alias for body
  category?: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  tags: string[];
  score: number; // Changed from voteScore
  voteScore: number; // Alias for score (for compatibility)
  commentsCount: number; // Changed from commentCount
  comments: IEmbeddedComment[]; // NEW: Embedded comments array
  isSolved: boolean;
  status: 'visible' | 'hidden' | 'deleted'; // Changed from isDeleted (boolean)
  deletedAt?: Date;
  deletedBy?: string;
  allowComments?: boolean;
  editCount?: number;
  expertiseLevel?: string;
  plantId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  extractHashtags(): string[];
}

// Embedded Comment Schema
const embeddedCommentSchema = new Schema<IEmbeddedComment>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    isExpertReply: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    _id: false, // Prevent automatic _id generation (we handle it manually)
  }
);

const communityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    authorUsername: {
      type: String,
      trim: true,
      maxlength: 50,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
      index: 'text',
    },
    body: {
      type: String,
      required: false,
      default: '',
      maxlength: 10000,
      index: 'text',
    },
    images: [
      {
        url: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
      },
    ],
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    score: {
      type: Number,
      default: 0,
      index: true,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    comments: {
      type: [embeddedCommentSchema],
      default: [],
    },
    isSolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['visible', 'hidden', 'deleted'],
      default: 'visible',
      index: true,
    },
    deletedAt: Date,
    deletedBy: String,
    category: { type: String },
    allowComments: { type: Boolean, default: true },
    editCount: { type: Number, default: 0 },
    expertiseLevel: { type: String },
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant' }
  },
  {
    collection: 'posts',
    timestamps: true,
  }
);

// Compound indexes for performance
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ score: -1, createdAt: -1 });
communityPostSchema.index({ tags: 1, createdAt: -1 });
communityPostSchema.index({ authorId: 1, createdAt: -1 });
communityPostSchema.index({ status: 1, createdAt: -1 });

// Virtual for excerpt
communityPostSchema.virtual('excerpt').get(function () {
  return this.body.substring(0, 200) + (this.body.length > 200 ? '...' : '');
});

// Virtual for voteScore as alias for score
communityPostSchema.virtual('voteScore').get(function () {
  return this.score;
}).set(function (value: number) {
  this.score = value;
});

// Virtual for author as alias for authorId
communityPostSchema.virtual('author').get(function () {
  return this.authorId;
});

// Virtual for content as alias for body
communityPostSchema.virtual('content').get(function () {
  return this.body;
}).set(function (value: string) {
  this.body = value;
});

// Method to extract hashtags from title and body
communityPostSchema.methods.extractHashtags = function (): string[] {
  const text = `${this.title} ${this.body}`;
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  
  // Remove # and convert to lowercase, remove duplicates
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
};

// Pre-save hook to auto-extract tags
communityPostSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isModified('body')) {
    this.tags = this.extractHashtags();
  }
  next();
});

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema);
