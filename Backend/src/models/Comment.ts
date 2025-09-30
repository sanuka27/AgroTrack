import mongoose, { Schema, Document } from 'mongoose';

// Comment status enum
export enum CommentStatus {
  PUBLISHED = 'published',
  PENDING = 'pending',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
  HIDDEN = 'hidden'
}

// Interface for Comment document
export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId; // For nested comments/replies
  status: CommentStatus;
  
  // Engagement metrics
  likes: number;
  dislikes: number;
  replies: number;
  
  // Moderation
  flagCount: number;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  moderationReason?: string;
  
  // Hierarchy and threading
  depth: number; // 0 for top-level, 1+ for replies
  path: string; // For efficient tree queries (e.g., "1.2.3")
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isEdited: boolean;
  
  // Virtual properties
  authorDetails?: any;
  repliesList?: any[];
  likesList?: any[];
  isLikedByUser?: boolean;
  canEdit?: boolean;
  canReply?: boolean;
  canModerate?: boolean;
  
  // Methods
  canBeEditedBy(userId: mongoose.Types.ObjectId): boolean;
  canBeModeratedBy(userId: mongoose.Types.ObjectId): boolean;
  canBeRepliedTo(): boolean;
  incrementReply(): Promise<void>;
  decrementReply(): Promise<void>;
  getEngagementScore(): number;
}

// Comment schema
const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment must be at least 1 character long'],
    maxlength: [5000, 'Comment cannot exceed 5,000 characters']
  },
  
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Comment post is required']
  },
  
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  status: {
    type: String,
    enum: Object.values(CommentStatus),
    default: CommentStatus.PUBLISHED
  },
  
  // Engagement metrics
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  dislikes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  replies: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Moderation fields
  flagCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  moderationReason: {
    type: String,
    maxlength: [500, 'Moderation reason cannot exceed 500 characters']
  },
  
  // Hierarchy fields
  depth: {
    type: Number,
    default: 0,
    min: 0,
    max: 5 // Limit nesting depth
  },
  
  path: {
    type: String,
    default: ''
  },
  
  // Edit tracking
  editedAt: {
    type: Date
  },
  
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ path: 1 });
commentSchema.index({ status: 1, createdAt: -1 });
commentSchema.index({ content: 'text' });

// Virtual for populated author details
commentSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true,
  select: 'name avatar role reputation isEmailVerified'
});

// Virtual for populated replies
commentSchema.virtual('repliesList', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  options: { sort: { createdAt: 1 }, limit: 10 }
});

// Virtual for populated likes
commentSchema.virtual('likesList', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'comment',
  match: { type: 'like' }
});

// Method to check if comment can be edited by user
commentSchema.methods.canBeEditedBy = function(userId: mongoose.Types.ObjectId): boolean {
  // Author can edit for 30 minutes, admins can always edit
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.author.equals(userId) && this.createdAt > thirtyMinutesAgo;
};

// Method to check if comment can be moderated by user
commentSchema.methods.canBeModeratedBy = function(userId: mongoose.Types.ObjectId): boolean {
  // Only admins and moderators can moderate comments
  // This would need to check user role, simplified for now
  return true; // Actual implementation would check user role
};

// Method to check if comment can be replied to
commentSchema.methods.canBeRepliedTo = function(): boolean {
  return this.depth < 5 && this.status === CommentStatus.PUBLISHED;
};

// Method to increment reply count
commentSchema.methods.incrementReply = async function(): Promise<void> {
  this.replies += 1;
  await this.save();
  
  // Also increment parent comment reply count
  if (this.parentComment) {
    await mongoose.model('Comment').findByIdAndUpdate(
      this.parentComment,
      { $inc: { replies: 1 } }
    );
  }
};

// Method to decrement reply count
commentSchema.methods.decrementReply = async function(): Promise<void> {
  this.replies = Math.max(0, this.replies - 1);
  await this.save();
  
  // Also decrement parent comment reply count
  if (this.parentComment) {
    await mongoose.model('Comment').findByIdAndUpdate(
      this.parentComment,
      { $inc: { replies: -1 } }
    );
  }
};

// Method to calculate engagement score
commentSchema.methods.getEngagementScore = function(): number {
  const weights = {
    likes: 2,
    replies: 3
  };
  
  return (
    this.likes * weights.likes +
    this.replies * weights.replies
  );
};

// Pre-save middleware
commentSchema.pre('save', async function(next) {
  // Set path for hierarchical queries
  if (this.parentComment && !this.path) {
    const parent = await mongoose.model('Comment').findById(this.parentComment);
    if (parent) {
      this.depth = parent.depth + 1;
      this.path = parent.path ? `${parent.path}.${this._id}` : this._id.toString();
    }
  } else if (!this.parentComment && !this.path) {
    this.path = this._id.toString();
  }
  
  // Mark as edited if content changed and not new
  if (!this.isNew && this.isModified('content')) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  next();
});

// Post-save middleware to update post comment count
commentSchema.post('save', async function() {
  if (this.status === CommentStatus.PUBLISHED) {
    await mongoose.model('Post').findByIdAndUpdate(
      this.post,
      { $inc: { comments: 1 } }
    );
  }
});

// Post-remove middleware to update counters
commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    // Decrement post comment count
    await mongoose.model('Post').findByIdAndUpdate(
      doc.post,
      { $inc: { comments: -1 } }
    );
    
    // Decrement parent comment reply count
    if (doc.parentComment) {
      await mongoose.model('Comment').findByIdAndUpdate(
        doc.parentComment,
        { $inc: { replies: -1 } }
      );
    }
    
    // Remove all child comments
    await mongoose.model('Comment').deleteMany({
      parentComment: doc._id
    });
  }
});

// Static methods
commentSchema.statics.findByPost = function(postId: mongoose.Types.ObjectId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({ 
    post: postId, 
    status: CommentStatus.PUBLISHED,
    parentComment: null // Only top-level comments
  })
  .populate('authorDetails')
  .populate({
    path: 'repliesList',
    populate: { path: 'authorDetails' }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

commentSchema.statics.findReplies = function(parentId: mongoose.Types.ObjectId) {
  return this.find({ 
    parentComment: parentId, 
    status: CommentStatus.PUBLISHED 
  })
  .populate('authorDetails')
  .sort({ createdAt: 1 });
};

commentSchema.statics.findByAuthor = function(authorId: mongoose.Types.ObjectId) {
  return this.find({ 
    author: authorId, 
    status: CommentStatus.PUBLISHED 
  })
  .populate('post', 'title slug')
  .sort({ createdAt: -1 });
};

commentSchema.statics.findTrending = function(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    status: CommentStatus.PUBLISHED,
    createdAt: { $gte: since }
  }).sort({ likes: -1, replies: -1 });
};

// Create and export the model
export const Comment = mongoose.model<IComment>('Comment', commentSchema);