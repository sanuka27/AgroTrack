import mongoose, { Schema, Document } from 'mongoose';

// Post category enum
export enum PostCategory {
  GENERAL = 'general',
  PLANT_CARE = 'plant-care',
  PLANT_ID = 'plant-identification',
  TROUBLESHOOTING = 'troubleshooting',
  SUCCESS_STORIES = 'success-stories',
  BEGINNER_TIPS = 'beginner-tips',
  ADVANCED_TECHNIQUES = 'advanced-techniques',
  SEASONAL_CARE = 'seasonal-care',
  TOOLS_EQUIPMENT = 'tools-equipment',
  DIY_PROJECTS = 'diy-projects'
}

// Post status enum
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  FLAGGED = 'flagged',
  REMOVED = 'removed'
}

// Interface for Post document
export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: PostCategory;
  tags: string[];
  images: string[];
  status: PostStatus;
  
  // Engagement metrics
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  
  // Moderation
  isFeatured: boolean;
  isPinned: boolean;
  isLocked: boolean;
  allowComments: boolean;
  flagCount: number;
  editCount: number;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  moderationReason?: string;
  
  // SEO and searchability
  slug: string;
  excerpt: string;
  readingTime: number; // in minutes
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Virtual properties
  commentsList?: any[];
  authorDetails?: any;
  likesList?: any[];
  isLikedByUser?: boolean;
  canEdit?: boolean;
  canModerate?: boolean;
  
  // Methods
  generateSlug(): string;
  calculateReadingTime(): number;
  canBeEditedBy(userId: mongoose.Types.ObjectId): boolean;
  canBeModeratedBy(userId: mongoose.Types.ObjectId): boolean;
  incrementView(): Promise<this>;
  getEngagementScore(): number;
}

// Post schema
const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Post content is required'],
    minlength: [10, 'Content must be at least 10 characters long'],
    maxlength: [50000, 'Content cannot exceed 50,000 characters']
  },
  
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post author is required']
  },
  
  category: {
    type: String,
    enum: Object.values(PostCategory),
    default: PostCategory.GENERAL,
    required: true
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  
  status: {
    type: String,
    enum: Object.values(PostStatus),
    default: PostStatus.DRAFT
  },
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
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
  
  comments: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  
  bookmarks: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Moderation fields
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isPinned: {
    type: Boolean,
    default: false
  },
  
  isLocked: {
    type: Boolean,
    default: false
  },
  
  allowComments: {
    type: Boolean,
    default: true
  },
  
  flagCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  editCount: {
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
  
  // SEO fields
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  
  readingTime: {
    type: Number,
    default: 1,
    min: 1
  },
  
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ views: -1 });
postSchema.index({ likes: -1 });
postSchema.index({ 'createdAt': -1 });

// ✅ Duplicate index removed to avoid Mongoose warning

// Virtual for populated comments
postSchema.virtual('commentsList', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  options: { sort: { createdAt: -1 }, limit: 5 }
});

// Virtual for populated author details
postSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true,
  select: 'name avatar role reputation isEmailVerified'
});

// Virtual for populated likes
postSchema.virtual('likesList', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post',
  match: { type: 'like' }
});

// Method to generate URL-friendly slug
postSchema.methods.generateSlug = function(): string {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
    
  return `${baseSlug}-${this._id.toString().slice(-6)}`;
};

// Method to calculate reading time based on content
postSchema.methods.calculateReadingTime = function(): number {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Method to check if post can be edited by user
postSchema.methods.canBeEditedBy = function(userId: mongoose.Types.ObjectId): boolean {
  // Author can edit for 24 hours, admins can always edit
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.author.equals(userId) && this.createdAt > twentyFourHoursAgo;
};

// Method to check if post can be moderated by user
postSchema.methods.canBeModeratedBy = function(userId: mongoose.Types.ObjectId): boolean {
  // Only admins and moderators can moderate posts
  // This would need to check user role, simplified for now
  return true; // Actual implementation would check user role
};

// Method to increment view count
postSchema.methods.incrementView = function(): Promise<IPost> {
  this.views += 1;
  return this.save();
};

// Method to calculate engagement score
postSchema.methods.getEngagementScore = function(): number {
  const weights = {
    views: 0.1,
    likes: 2,
    comments: 3,
    shares: 4,
    bookmarks: 2.5
  };
  
  return (
    this.views * weights.views +
    this.likes * weights.likes +
    this.comments * weights.comments +
    this.shares * weights.shares +
    this.bookmarks * weights.bookmarks
  );
};

// Pre-save middleware
postSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }
  
  // Calculate reading time
  this.readingTime = this.calculateReadingTime();
  
  // Generate excerpt if not provided
  if (!this.excerpt) {
    this.excerpt = this.content.substring(0, 250).replace(/\s+\S*$/, '') + '...';
  }
  
  // Set published date when status changes to published
  if (this.status === PostStatus.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Static methods
postSchema.statics.findByCategory = function(category: PostCategory) {
  return this.find({ 
    category, 
    status: PostStatus.PUBLISHED 
  }).sort({ publishedAt: -1 });
};

postSchema.statics.findByTag = function(tag: string) {
  return this.find({ 
    tags: tag, 
    status: PostStatus.PUBLISHED 
  }).sort({ publishedAt: -1 });
};

postSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true, 
    status: PostStatus.PUBLISHED 
  }).sort({ publishedAt: -1 });
};

postSchema.statics.findTrending = function(days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({ 
    status: PostStatus.PUBLISHED,
    publishedAt: { $gte: since }
  }).sort({ views: -1, likes: -1 });
};

// Create and export the model
export const Post = mongoose.model<IPost>('Post', postSchema);