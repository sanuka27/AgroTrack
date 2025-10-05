import mongoose, { Schema, Document } from 'mongoose';

// Series status enum
export enum SeriesStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Interface for BlogSeries document
export interface IBlogSeries extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  author: mongoose.Types.ObjectId;
  status: SeriesStatus;
  
  // Visual
  coverImage?: string;
  color?: string;
  
  // Content organization
  posts: {
    post: mongoose.Types.ObjectId;
    order: number;
    isPublished: boolean;
  }[];
  
  totalPosts: number;
  publishedPosts: number;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Engagement
  views: number;
  likes: number;
  bookmarks: number;
  averageRating: number;
  totalRatings: number;
  
  // Publishing
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: string; // e.g., "4 weeks", "2 months"
  
  // Settings
  isPublic: boolean;
  isFeatured: boolean;
  requiresSubscription: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  authorDetails?: any;
  postDetails?: any[];
  
  // Methods
  generateSlug(): string;
  addPost(postId: mongoose.Types.ObjectId, order?: number): Promise<void>;
  removePost(postId: mongoose.Types.ObjectId): Promise<void>;
  reorderPosts(newOrder: { postId: mongoose.Types.ObjectId; order: number }[]): Promise<void>;
  updateStats(): Promise<void>;
  getProgress(): number;
  canBeEditedBy(userId: mongoose.Types.ObjectId): boolean;
}

// BlogSeries schema
const blogSeriesSchema = new Schema<IBlogSeries>({
  title: {
    type: String,
    required: [true, 'Series title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Series description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Series author is required']
  },
  
  status: {
    type: String,
    enum: Object.values(SeriesStatus),
    default: SeriesStatus.DRAFT
  },
  
  // Visual elements
  coverImage: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid cover image URL format'
    }
  },
  
  color: {
    type: String,
    match: [/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color format (use hex format)'],
    default: '#3B82F6'
  },
  
  // Posts in the series
  posts: [{
    post: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  }],
  
  totalPosts: {
    type: Number,
    default: 0,
    min: 0
  },
  
  publishedPosts: {
    type: Number,
    default: 0,
    min: 0
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
  
  bookmarks: {
    type: Number,
    default: 0,
    min: 0
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
  
  // Timeline
  startedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  estimatedDuration: {
    type: String,
    maxlength: [50, 'Estimated duration cannot exceed 50 characters']
  },
  
  // Settings
  isPublic: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  requiresSubscription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
blogSeriesSchema.index({ author: 1, createdAt: -1 });
blogSeriesSchema.index({ status: 1, isPublic: 1 });
blogSeriesSchema.index({ isFeatured: 1, status: 1 });
blogSeriesSchema.index({ views: -1 });
blogSeriesSchema.index({ 'posts.post': 1 });
blogSeriesSchema.index({ title: 'text', description: 'text' });

// ✅ Duplicate index removed to avoid Mongoose warning

// Virtual for populated author details
blogSeriesSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true,
  select: 'name avatar bio role'
});

// Virtual for populated post details
blogSeriesSchema.virtual('postDetails', {
  ref: 'BlogPost',
  localField: 'posts.post',
  foreignField: '_id',
  options: { sort: { 'posts.order': 1 } }
});

// Method to generate slug
blogSeriesSchema.methods.generateSlug = function(): string {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
    
  return `${baseSlug}-${this._id.toString().slice(-6)}`;
};

// Method to add a post to the series
blogSeriesSchema.methods.addPost = async function(postId: mongoose.Types.ObjectId, order?: number): Promise<void> {
  // Check if post already exists in series
  const existingPost = this.posts.find((p: any) => p.post.equals(postId));
  if (existingPost) {
    throw new Error('Post already exists in this series');
  }
  
  // Determine order
  const postOrder = order || this.posts.length + 1;
  
  // Check if post is published
  const post = await mongoose.model('BlogPost').findById(postId);
  const isPublished = post?.status === 'published';
  
  this.posts.push({
    post: postId,
    order: postOrder,
    isPublished
  });
  
  await this.updateStats();
  await this.save();
};

// Method to remove a post from the series
blogSeriesSchema.methods.removePost = async function(postId: mongoose.Types.ObjectId): Promise<void> {
  this.posts = this.posts.filter((p: any) => !p.post.equals(postId));
  await this.updateStats();
  await this.save();
};

// Method to reorder posts in the series
blogSeriesSchema.methods.reorderPosts = async function(newOrder: { postId: mongoose.Types.ObjectId; order: number }[]): Promise<void> {
  for (const orderItem of newOrder) {
    const post = this.posts.find((p: any) => p.post.equals(orderItem.postId));
    if (post) {
      post.order = orderItem.order;
    }
  }
  
  // Sort posts by order
  this.posts.sort((a: any, b: any) => a.order - b.order);
  await this.save();
};

// Method to update statistics
blogSeriesSchema.methods.updateStats = async function(): Promise<void> {
  this.totalPosts = this.posts.length;
  this.publishedPosts = this.posts.filter((p: any) => p.isPublished).length;
  
  // Update completion status
  if (this.status === SeriesStatus.ACTIVE && this.publishedPosts === this.totalPosts && this.totalPosts > 0) {
    this.status = SeriesStatus.COMPLETED;
    this.completedAt = new Date();
  }
};

// Method to get series progress percentage
blogSeriesSchema.methods.getProgress = function(): number {
  if (this.totalPosts === 0) return 0;
  return Math.round((this.publishedPosts / this.totalPosts) * 100);
};

// Method to check if series can be edited by user
blogSeriesSchema.methods.canBeEditedBy = function(userId: mongoose.Types.ObjectId): boolean {
  return this.author.equals(userId);
};

// Pre-save middleware
blogSeriesSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }
  
  // Set started date when status changes to active
  if (this.status === SeriesStatus.ACTIVE && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // Generate SEO fields if missing
  if (!this.metaTitle) {
    this.metaTitle = this.title;
  }
  
  if (!this.metaDescription) {
    this.metaDescription = this.description.substring(0, 160);
  }
  
  next();
});

// Static methods
blogSeriesSchema.statics.findPublic = function() {
  return this.find({ 
    isPublic: true,
    status: { $in: [SeriesStatus.ACTIVE, SeriesStatus.COMPLETED] }
  }).sort({ createdAt: -1 });
};

blogSeriesSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true,
    isPublic: true,
    status: { $in: [SeriesStatus.ACTIVE, SeriesStatus.COMPLETED] }
  }).sort({ createdAt: -1 });
};

blogSeriesSchema.statics.findByAuthor = function(authorId: mongoose.Types.ObjectId) {
  return this.find({ author: authorId }).sort({ createdAt: -1 });
};

blogSeriesSchema.statics.findActive = function() {
  return this.find({ 
    status: SeriesStatus.ACTIVE,
    isPublic: true
  }).sort({ startedAt: -1 });
};

blogSeriesSchema.statics.findCompleted = function() {
  return this.find({ 
    status: SeriesStatus.COMPLETED,
    isPublic: true
  }).sort({ completedAt: -1 });
};

// Create and export the model
export const BlogSeries = mongoose.model<IBlogSeries>('BlogSeries', blogSeriesSchema);