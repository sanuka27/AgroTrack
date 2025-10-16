import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  category?: string;
  series?: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  migratedAt: Date;
  source: string;
}

const BlogSchema = new Schema<IBlog>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  body: { type: String, required: true },
  tags: [String],
  category: String,
  series: String,
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  migratedAt: { type: Date, default: Date.now },
  source: String
}, {
  timestamps: true
});

// Indexes
BlogSchema.index({ slug: 1 });
BlogSchema.index({ authorId: 1, createdAt: -1 });
BlogSchema.index({ tags: 1 });

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);