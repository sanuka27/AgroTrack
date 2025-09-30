import mongoose, { Schema, Document } from 'mongoose';

// Interface for BlogTag document
export interface IBlogTag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Statistics
  postCount: number;
  
  // Settings
  isActive: boolean;
  isVisible: boolean;
  isTrending: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  
  // Virtual properties
  posts?: any[];
  
  // Methods
  generateSlug(): string;
  updatePostCount(): Promise<void>;
}

// BlogTag schema
const blogTagSchema = new Schema<IBlogTag>({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    minlength: [2, 'Tag name must be at least 2 characters long'],
    maxlength: [30, 'Tag name cannot exceed 30 characters'],
    lowercase: true
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  
  color: {
    type: String,
    match: [/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color format (use hex format)'],
    default: '#6B7280'
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
  
  // Statistics
  postCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVisible: {
    type: Boolean,
    default: true
  },
  
  isTrending: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
blogTagSchema.index({ slug: 1 });
blogTagSchema.index({ name: 1 });
blogTagSchema.index({ isActive: 1, isVisible: 1 });
blogTagSchema.index({ postCount: -1 });
blogTagSchema.index({ isTrending: 1, postCount: -1 });
blogTagSchema.index({ name: 'text', description: 'text' });

// Virtual for posts with this tag
blogTagSchema.virtual('posts', {
  ref: 'BlogPost',
  localField: '_id',
  foreignField: 'tags',
  match: { status: 'published', isPublic: true }
});

// Method to generate slug
blogTagSchema.methods.generateSlug = function(): string {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Method to update post count
blogTagSchema.methods.updatePostCount = async function(): Promise<void> {
  const count = await mongoose.model('BlogPost').countDocuments({
    tags: this._id,
    status: 'published',
    isPublic: true
  });
  
  this.postCount = count;
  await this.save();
};

// Pre-save middleware
blogTagSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }
  
  // Generate SEO fields if missing
  if (!this.metaTitle) {
    this.metaTitle = `Posts tagged with "${this.name}"`;
  }
  
  if (!this.metaDescription && this.description) {
    this.metaDescription = this.description.substring(0, 160);
  } else if (!this.metaDescription) {
    this.metaDescription = `Explore all posts tagged with ${this.name}. Discover tips, guides, and insights about ${this.name}.`;
  }
  
  next();
});

// Post-save middleware to update post counts
blogTagSchema.post('save', async function() {
  await this.updatePostCount();
});

// Static methods
blogTagSchema.statics.findActive = function() {
  return this.find({ 
    isActive: true,
    isVisible: true 
  }).sort({ name: 1 });
};

blogTagSchema.statics.findPopular = function(limit: number = 20) {
  return this.find({ 
    postCount: { $gt: 0 },
    isActive: true,
    isVisible: true 
  })
  .sort({ postCount: -1, name: 1 })
  .limit(limit);
};

blogTagSchema.statics.findTrending = function() {
  return this.find({ 
    isTrending: true,
    isActive: true,
    isVisible: true 
  }).sort({ postCount: -1, name: 1 });
};

blogTagSchema.statics.findWithPosts = function() {
  return this.find({ 
    postCount: { $gt: 0 },
    isActive: true,
    isVisible: true 
  }).sort({ postCount: -1, name: 1 });
};

blogTagSchema.statics.searchTags = function(query: string) {
  return this.find({ 
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ],
    isActive: true,
    isVisible: true 
  }).sort({ postCount: -1, name: 1 });
};

// Create and export the model
export const BlogTag = mongoose.model<IBlogTag>('BlogTag', blogTagSchema);