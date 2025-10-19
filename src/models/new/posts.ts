import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId; // Original posts _id
  authorId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  images?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  comments: IComment[];
  voteCount: number;
  voterIds?: mongoose.Types.ObjectId[]; // Only if < 5k voters
  migratedAt: Date;
  source: string;
}

const CommentSchema = new Schema<IComment>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const PostSchema = new Schema<IPost>({
  sourceId: { type: Schema.Types.ObjectId, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  images: [String],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  comments: [CommentSchema],
  voteCount: { type: Number, default: 0 },
  voterIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  migratedAt: { type: Date, default: Date.now },
  source: String
}, {
  timestamps: true
});

// Indexes
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);