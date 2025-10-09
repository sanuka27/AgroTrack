import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityPost extends Document {
  authorUid: string;
  title: string;
  bodyMarkdown: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  tags: string[];
  voteScore: number; // Denormalized count
  commentCount: number; // Denormalized count
  isSolved: boolean;
  isDeleted: boolean; // Soft delete
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  extractHashtags(): string[];
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    authorUid: {
      type: String,
      required: true,
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
    bodyMarkdown: {
      type: String,
      required: true,
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
    voteScore: {
      type: Number,
      default: 0,
      index: true,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    isSolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ voteScore: -1, createdAt: -1 });
communityPostSchema.index({ tags: 1, createdAt: -1 });
communityPostSchema.index({ authorUid: 1, createdAt: -1 });
communityPostSchema.index({ isDeleted: 1, createdAt: -1 });

// Virtual for excerpt
communityPostSchema.virtual('excerpt').get(function () {
  return this.bodyMarkdown.substring(0, 200) + (this.bodyMarkdown.length > 200 ? '...' : '');
});

// Method to extract hashtags from title and body
communityPostSchema.methods.extractHashtags = function (): string[] {
  const text = `${this.title} ${this.bodyMarkdown}`;
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  
  // Remove # and convert to lowercase, remove duplicates
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
};

// Pre-save hook to auto-extract tags
communityPostSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isModified('bodyMarkdown')) {
    this.tags = this.extractHashtags();
  }
  next();
});

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema);
