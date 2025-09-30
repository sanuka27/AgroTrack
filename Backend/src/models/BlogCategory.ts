import mongoose, { Schema, Document } from 'mongoose';

// Interface for BlogCategory document
export interface IBlogCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  image?: string;
  
  // Hierarchy support
  parent?: mongoose.Types.ObjectId;
  path: string; // For nested categories (e.g., "plants.care.watering")
  level: number; // 0 for root, 1+ for subcategories
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Statistics
  postCount: number;
  
  // Settings
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  
  // Virtual properties
  posts?: any[];
  subcategories?: any[];
  parentCategory?: any;
  
  // Methods
  generateSlug(): string;
  updatePostCount(): Promise<void>;
  getAncestors(): Promise<IBlogCategory[]>;
  getDescendants(): Promise<IBlogCategory[]>;
}

// BlogCategory schema
const blogCategorySchema = new Schema<IBlogCategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  color: {
    type: String,
    match: [/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color format (use hex format)'],
    default: '#10B981'
  },
  
  icon: {
    type: String,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  
  image: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  },
  
  // Hierarchy
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'BlogCategory',
    default: null
  },
  
  path: {
    type: String,
    default: ''
  },
  
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5 // Limit depth
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
  
  sortOrder: {
    type: Number,
    default: 0
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
blogCategorySchema.index({ slug: 1 });
blogCategorySchema.index({ parent: 1, sortOrder: 1 });
blogCategorySchema.index({ path: 1 });
blogCategorySchema.index({ isActive: 1, isVisible: 1 });
blogCategorySchema.index({ name: 'text', description: 'text' });

// Virtual for posts in this category
blogCategorySchema.virtual('posts', {
  ref: 'BlogPost',
  localField: '_id',
  foreignField: 'categories',
  match: { status: 'published', isPublic: true }
});

// Virtual for subcategories
blogCategorySchema.virtual('subcategories', {
  ref: 'BlogCategory',
  localField: '_id',
  foreignField: 'parent',
  options: { sort: { sortOrder: 1, name: 1 } }
});

// Virtual for parent category
blogCategorySchema.virtual('parentCategory', {
  ref: 'BlogCategory',
  localField: 'parent',
  foreignField: '_id',
  justOne: true
});

// Method to generate slug
blogCategorySchema.methods.generateSlug = function(): string {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Method to update post count
blogCategorySchema.methods.updatePostCount = async function(): Promise<void> {
  const count = await mongoose.model('BlogPost').countDocuments({
    categories: this._id,
    status: 'published',
    isPublic: true
  });
  
  this.postCount = count;
  await this.save();
};

// Method to get all ancestor categories
blogCategorySchema.methods.getAncestors = async function(): Promise<any[]> {
  const ancestors: any[] = [];
  let currentParentId = this.parent;
  
  while (currentParentId) {
    const parent = await mongoose.model('BlogCategory').findById(currentParentId);
    if (parent) {
      ancestors.unshift(parent);
      currentParentId = parent.parent;
    } else {
      break;
    }
  }
  
  return ancestors;
};

// Method to get all descendant categories
blogCategorySchema.methods.getDescendants = async function(): Promise<IBlogCategory[]> {
  return await mongoose.model('BlogCategory').find({
    path: new RegExp(`^${this.path}\\.`)
  }).sort({ path: 1 });
};

// Pre-save middleware
blogCategorySchema.pre('save', async function(next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }
  
  // Update hierarchy path and level
  if (this.parent) {
    const parent = await mongoose.model('BlogCategory').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}.${this.slug}` : this.slug;
    }
  } else {
    this.level = 0;
    this.path = this.slug;
  }
  
  // Generate SEO fields if missing
  if (!this.metaTitle) {
    this.metaTitle = this.name;
  }
  
  if (!this.metaDescription && this.description) {
    this.metaDescription = this.description.substring(0, 160);
  }
  
  next();
});

// Post-save middleware to update post counts
blogCategorySchema.post('save', async function() {
  await this.updatePostCount();
});

// Static methods
blogCategorySchema.statics.findActive = function() {
  return this.find({ 
    isActive: true,
    isVisible: true 
  }).sort({ sortOrder: 1, name: 1 });
};

blogCategorySchema.statics.findRootCategories = function() {
  return this.find({ 
    parent: null,
    isActive: true,
    isVisible: true 
  }).sort({ sortOrder: 1, name: 1 });
};

blogCategorySchema.statics.findByParent = function(parentId: mongoose.Types.ObjectId) {
  return this.find({ 
    parent: parentId,
    isActive: true,
    isVisible: true 
  }).sort({ sortOrder: 1, name: 1 });
};

blogCategorySchema.statics.findWithPosts = function() {
  return this.find({ 
    postCount: { $gt: 0 },
    isActive: true,
    isVisible: true 
  }).sort({ postCount: -1, name: 1 });
};

// Create and export the model
export const BlogCategory = mongoose.model<IBlogCategory>('BlogCategory', blogCategorySchema);