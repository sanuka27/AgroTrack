import mongoose, { Schema, Document } from 'mongoose';

// Blog post status enum
export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
  PRIVATE = 'private'
}

// Content type enum
export enum ContentType {
  GUIDE = 'guide',
  TUTORIAL = 'tutorial',
  TIPS = 'tips',
  NEWS = 'news',
  SEASONAL = 'seasonal',
  PLANT_SPOTLIGHT = 'plant-spotlight',
  TROUBLESHOOTING = 'troubleshooting',
  BEGINNER = 'beginner',
  ADVANCED = 'advanced',
  RESEARCH = 'research'
}

// Interface for BlogPost document
export interface IBlogPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: mongoose.Types.ObjectId;
  status: BlogPostStatus;
  contentType: ContentType;
  
  // SEO and metadata
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  
  // Media
  featuredImage?: string;
  images: string[];
  videos: string[];
  
  // Categories and tags
  categories: mongoose.Types.ObjectId[];
  tags: mongoose.Types.ObjectId[];
  
  // Publishing
  publishedAt?: Date;
  scheduledFor?: Date;
  lastModified: Date;
  
  // Engagement metrics
  views: number;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  
  // Reading metrics
  readingTime: number; // in minutes
  averageRating: number;
  totalRatings: number;
  
  // Content structure
  tableOfContents: {
    heading: string;
    level: number;
    anchor: string;
  }[];
  
  // Features
  isFeatured: boolean;
  isPopular: boolean;
  isEditorsPick: boolean;
  
  // Visibility and access
  isPublic: boolean;
  requiresSubscription: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Related content
  relatedPosts: mongoose.Types.ObjectId[];
  series?: mongoose.Types.ObjectId;
  
  // Analytics
  readingSessions: {
    totalSessions: number;
    completionRate: number;
    averageTimeSpent: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  authorDetails?: any;
  categoryDetails?: any[];
  tagDetails?: any[];
  seriesDetails?: any;
  
  // Methods
  generateSlug(): string;
  calculateReadingTime(): number;
  generateTableOfContents(): void;
  canBeEditedBy(userId: mongoose.Types.ObjectId): boolean;
  incrementView(): Promise<this>;
  updateRating(rating: number): Promise<void>;
  getEngagementScore(): number;
  getSEOScore(): number;
}

// BlogPost schema
const blogPostSchema = new Schema<IBlogPost>({
  title: {
    type: String,
    required: [true, 'Blog post title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters long'],
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Blog post content is required'],
    minlength: [100, 'Content must be at least 100 characters long']
  },
  
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Blog post author is required']
  },
  
  status: {
    type: String,
    enum: Object.values(BlogPostStatus),
    default: BlogPostStatus.DRAFT
  },
  
  contentType: {
    type: String,
    enum: Object.values(ContentType),
    default: ContentType.GUIDE
  },
  
  // SEO fields
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  
  keywords: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Keyword cannot exceed 50 characters']
  }],
  
  // Media fields
  featuredImage: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid featured image URL format'
    }
  },
  
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  
  videos: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(mp4|webm|ogg|avi|mov)$/i.test(v) || 
               /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/.test(v);
      },
      message: 'Invalid video URL format'
    }
  }],
  
  // Taxonomy
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'BlogCategory'
  }],
  
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'BlogTag'
  }],
  
  // Publishing dates
  publishedAt: {
    type: Date
  },
  
  scheduledFor: {
    type: Date
  },
  
  lastModified: {
    type: Date,
    default: Date.now
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
  
  comments: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Reading metrics
  readingTime: {
    type: Number,
    default: 1,
    min: 1
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Table of contents
  tableOfContents: [{
    heading: {
      type: String,
      required: true
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    anchor: {
      type: String,
      required: true
    }
  }],
  
  // Feature flags
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  isEditorsPick: {
    type: Boolean,
    default: false
  },
  
  // Access control
  isPublic: {
    type: Boolean,
    default: true
  },
  
  requiresSubscription: {
    type: Boolean,
    default: false
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Related content
  relatedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'BlogPost'
  }],
  
  series: {
    type: Schema.Types.ObjectId,
    ref: 'BlogSeries'
  },
  
  // Analytics object
  readingSessions: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
blogPostSchema.index({ author: 1, createdAt: -1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ contentType: 1, status: 1 });
blogPostSchema.index({ categories: 1, status: 1 });
blogPostSchema.index({ tags: 1, status: 1 });
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
blogPostSchema.index({ isFeatured: 1, status: 1 });
blogPostSchema.index({ isPopular: 1, status: 1 });
blogPostSchema.index({ views: -1 });
blogPostSchema.index({ scheduledFor: 1, status: 1 });

// Virtual for populated author details
blogPostSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true,
  select: 'name avatar bio role'
});

// Virtual for populated category details
blogPostSchema.virtual('categoryDetails', {
  ref: 'BlogCategory',
  localField: 'categories',
  foreignField: '_id'
});

// Virtual for populated tag details
blogPostSchema.virtual('tagDetails', {
  ref: 'BlogTag',
  localField: 'tags',
  foreignField: '_id'
});

// Virtual for populated series details
blogPostSchema.virtual('seriesDetails', {
  ref: 'BlogSeries',
  localField: 'series',
  foreignField: '_id',
  justOne: true
});

// Method to generate URL-friendly slug
blogPostSchema.methods.generateSlug = function(): string {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
    
  return `${baseSlug}-${this._id.toString().slice(-6)}`;
};

// Method to calculate reading time
blogPostSchema.methods.calculateReadingTime = function(): number {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Method to generate table of contents from content
blogPostSchema.methods.generateTableOfContents = function(): void {
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(this.content)) !== null) {
    const level = parseInt(match[1] || '1');
    const text = (match[2] || '').replace(/<[^>]*>/g, '').trim();
    const anchor = text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    headings.push({
      heading: text,
      level: level,
      anchor: anchor
    });
  }
  
  this.tableOfContents = headings;
};

// Method to check if post can be edited by user
blogPostSchema.methods.canBeEditedBy = function(userId: mongoose.Types.ObjectId): boolean {
  return this.author.equals(userId) || 
         // Would need to check if user is admin/editor
         false;
};

// Method to increment view count
blogPostSchema.methods.incrementView = function(): Promise<IBlogPost> {
  this.views += 1;
  return this.save();
};

// Method to update rating
blogPostSchema.methods.updateRating = async function(rating: number): Promise<void> {
  const newTotalRatings = this.totalRatings + 1;
  const newAverageRating = ((this.averageRating * this.totalRatings) + rating) / newTotalRatings;
  
  this.averageRating = Math.round(newAverageRating * 10) / 10;
  this.totalRatings = newTotalRatings;
  
  await this.save();
};

// Method to calculate engagement score
blogPostSchema.methods.getEngagementScore = function(): number {
  const weights = {
    views: 0.1,
    likes: 2,
    comments: 3,
    shares: 4,
    bookmarks: 2.5,
    rating: 5
  };
  
  return (
    this.views * weights.views +
    this.likes * weights.likes +
    this.comments * weights.comments +
    this.shares * weights.shares +
    this.bookmarks * weights.bookmarks +
    this.averageRating * weights.rating
  );
};

// Method to calculate SEO score
blogPostSchema.methods.getSEOScore = function(): number {
  let score = 0;
  
  // Title length (ideal: 30-60 characters)
  if (this.title.length >= 30 && this.title.length <= 60) score += 20;
  else if (this.title.length >= 20 && this.title.length <= 70) score += 10;
  
  // Meta description (ideal: 120-160 characters)
  if (this.metaDescription && this.metaDescription.length >= 120 && this.metaDescription.length <= 160) score += 20;
  else if (this.metaDescription && this.metaDescription.length >= 100) score += 10;
  
  // Has featured image
  if (this.featuredImage) score += 15;
  
  // Has keywords
  if (this.keywords.length >= 3) score += 15;
  else if (this.keywords.length >= 1) score += 10;
  
  // Content length (ideal: 1000+ words)
  const wordCount = this.content.split(/\s+/).length;
  if (wordCount >= 1000) score += 20;
  else if (wordCount >= 500) score += 15;
  else if (wordCount >= 300) score += 10;
  
  // Has table of contents
  if (this.tableOfContents.length > 0) score += 10;
  
  return Math.min(100, score);
};

// Pre-save middleware
blogPostSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }
  
  // Calculate reading time
  this.readingTime = this.calculateReadingTime();
  
  // Generate table of contents
  this.generateTableOfContents();
  
  // Update last modified
  this.lastModified = new Date();
  
  // Set published date when status changes to published
  if (this.status === BlogPostStatus.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate SEO fields if missing
  if (!this.metaTitle) {
    this.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Static methods
blogPostSchema.statics.findPublished = function() {
  return this.find({ 
    status: BlogPostStatus.PUBLISHED,
    isPublic: true,
    publishedAt: { $lte: new Date() }
  }).sort({ publishedAt: -1 });
};

blogPostSchema.statics.findByCategory = function(categoryId: mongoose.Types.ObjectId) {
  return this.find({ 
    categories: categoryId,
    status: BlogPostStatus.PUBLISHED,
    isPublic: true
  }).sort({ publishedAt: -1 });
};

blogPostSchema.statics.findByTag = function(tagId: mongoose.Types.ObjectId) {
  return this.find({ 
    tags: tagId,
    status: BlogPostStatus.PUBLISHED,
    isPublic: true
  }).sort({ publishedAt: -1 });
};

blogPostSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true,
    status: BlogPostStatus.PUBLISHED,
    isPublic: true
  }).sort({ publishedAt: -1 });
};

blogPostSchema.statics.findPopular = function(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({ 
    status: BlogPostStatus.PUBLISHED,
    isPublic: true,
    publishedAt: { $gte: since }
  }).sort({ views: -1, likes: -1 });
};

blogPostSchema.statics.findScheduled = function() {
  return this.find({ 
    status: BlogPostStatus.SCHEDULED,
    scheduledFor: { $lte: new Date() }
  });
};

// Create and export the model
export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);