import mongoose, { Schema, Document } from 'mongoose';

// Like type enum
export enum LikeType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  BOOKMARK = 'bookmark',
  SHARE = 'share',
  REPORT = 'report',
  FOLLOW = 'follow'
}

// Target type enum
export enum TargetType {
  POST = 'post',
  COMMENT = 'comment',
  USER = 'user'
}

// Interface for Like document
export interface ILike extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  targetType: TargetType;
  targetId: mongoose.Types.ObjectId;
  type: LikeType;
  
  // For posts
  post?: mongoose.Types.ObjectId;
  
  // For comments
  comment?: mongoose.Types.ObjectId;
  
  // For user follows
  followedUser?: mongoose.Types.ObjectId;
  
  // Report specific fields
  reportReason?: string;
  reportDetails?: string;
  isResolved?: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  userDetails?: any;
  targetDetails?: any;
  
  // Methods
  isReportType(): boolean;
  canBeResolvedBy(userId: mongoose.Types.ObjectId): boolean;
}

// Like schema
const likeSchema = new Schema<ILike>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  targetType: {
    type: String,
    enum: Object.values(TargetType),
    required: [true, 'Target type is required']
  },
  
  targetId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Target ID is required']
  },
  
  type: {
    type: String,
    enum: Object.values(LikeType),
    required: [true, 'Like type is required']
  },
  
  // Reference fields based on target type
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  
  followedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Report specific fields
  reportReason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'inappropriate-content',
      'misinformation',
      'copyright-violation',
      'off-topic',
      'duplicate',
      'other'
    ]
  },
  
  reportDetails: {
    type: String,
    maxlength: [1000, 'Report details cannot exceed 1,000 characters']
  },
  
  isResolved: {
    type: Boolean,
    default: false
  },
  
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes to ensure uniqueness and performance
likeSchema.index({ user: 1, targetType: 1, targetId: 1, type: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1, type: 1 });
likeSchema.index({ user: 1, type: 1, createdAt: -1 });
likeSchema.index({ post: 1, type: 1 });
likeSchema.index({ comment: 1, type: 1 });
likeSchema.index({ followedUser: 1, type: 1 });
likeSchema.index({ type: 1, isResolved: 1 }); // For reports

// Virtual for populated user details
likeSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
  select: 'name avatar role reputation'
});

// Method to check if this is a report type
likeSchema.methods.isReportType = function(): boolean {
  return this.type === LikeType.REPORT;
};

// Method to check if report can be resolved by user
likeSchema.methods.canBeResolvedBy = function(userId: mongoose.Types.ObjectId): boolean {
  // Only admins and moderators can resolve reports
  // This would need to check user role, simplified for now
  return true; // Actual implementation would check user role
};

// Pre-save middleware
likeSchema.pre('save', function(next) {
  // Set reference fields based on target type
  if (this.targetType === TargetType.POST) {
    this.post = this.targetId;
    this.comment = undefined;
    this.followedUser = undefined;
  } else if (this.targetType === TargetType.COMMENT) {
    this.comment = this.targetId;
    this.post = undefined;
    this.followedUser = undefined;
  } else if (this.targetType === TargetType.USER) {
    this.followedUser = this.targetId;
    this.post = undefined;
    this.comment = undefined;
  }
  
  // Validate report fields
  if (this.type === LikeType.REPORT && !this.reportReason) {
    return next(new Error('Report reason is required for report type'));
  }
  
  next();
});

// Post-save middleware to update counters
likeSchema.post('save', async function() {
  if (this.targetType === TargetType.POST) {
    const updateField = this.type === LikeType.LIKE ? 'likes' : 
                       this.type === LikeType.DISLIKE ? 'dislikes' :
                       this.type === LikeType.BOOKMARK ? 'bookmarks' :
                       this.type === LikeType.SHARE ? 'shares' : null;
    
    if (updateField) {
      await mongoose.model('Post').findByIdAndUpdate(
        this.targetId,
        { $inc: { [updateField]: 1 } }
      );
    }
  } else if (this.targetType === TargetType.COMMENT) {
    const updateField = this.type === LikeType.LIKE ? 'likes' : 
                       this.type === LikeType.DISLIKE ? 'dislikes' : null;
    
    if (updateField) {
      await mongoose.model('Comment').findByIdAndUpdate(
        this.targetId,
        { $inc: { [updateField]: 1 } }
      );
    }
  }
});

// Post-remove middleware to update counters
likeSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    if (doc.targetType === TargetType.POST) {
      const updateField = doc.type === LikeType.LIKE ? 'likes' : 
                         doc.type === LikeType.DISLIKE ? 'dislikes' :
                         doc.type === LikeType.BOOKMARK ? 'bookmarks' :
                         doc.type === LikeType.SHARE ? 'shares' : null;
      
      if (updateField) {
        await mongoose.model('Post').findByIdAndUpdate(
          doc.targetId,
          { $inc: { [updateField]: -1 } }
        );
      }
    } else if (doc.targetType === TargetType.COMMENT) {
      const updateField = doc.type === LikeType.LIKE ? 'likes' : 
                         doc.type === LikeType.DISLIKE ? 'dislikes' : null;
      
      if (updateField) {
        await mongoose.model('Comment').findByIdAndUpdate(
          doc.targetId,
          { $inc: { [updateField]: -1 } }
        );
      }
    }
  }
});

// Static methods
likeSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId, type?: LikeType) {
  const query: any = { user: userId };
  if (type) query.type = type;
  
  return this.find(query)
    .populate('post', 'title slug createdAt')
    .populate('comment', 'content createdAt')
    .populate('followedUser', 'name avatar')
    .sort({ createdAt: -1 });
};

likeSchema.statics.findByTarget = function(targetType: TargetType, targetId: mongoose.Types.ObjectId, type?: LikeType) {
  const query: any = { targetType, targetId };
  if (type) query.type = type;
  
  return this.find(query)
    .populate('userDetails')
    .sort({ createdAt: -1 });
};

likeSchema.statics.getUserLikeStatus = function(userId: mongoose.Types.ObjectId, targetType: TargetType, targetId: mongoose.Types.ObjectId) {
  return this.find({
    user: userId,
    targetType,
    targetId,
    type: { $in: [LikeType.LIKE, LikeType.DISLIKE, LikeType.BOOKMARK] }
  });
};

likeSchema.statics.getEngagementStats = function(targetType: TargetType, targetId: mongoose.Types.ObjectId) {
  return this.aggregate([
    {
      $match: { targetType, targetId }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
};

likeSchema.statics.findPendingReports = function() {
  return this.find({
    type: LikeType.REPORT,
    isResolved: false
  })
    .populate('userDetails')
    .populate('post', 'title content author')
    .populate('comment', 'content author')
    .sort({ createdAt: -1 });
};

likeSchema.statics.getUserBookmarks = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    user: userId,
    type: LikeType.BOOKMARK
  })
    .populate('post', 'title slug excerpt createdAt author')
    .sort({ createdAt: -1 });
};

likeSchema.statics.getUserFollowing = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    user: userId,
    type: LikeType.FOLLOW
  })
    .populate('followedUser', 'name avatar bio reputation')
    .sort({ createdAt: -1 });
};

likeSchema.statics.getUserFollowers = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    followedUser: userId,
    type: LikeType.FOLLOW
  })
    .populate('userDetails')
    .sort({ createdAt: -1 });
};

// Create and export the model
export const Like = mongoose.model<ILike>('Like', likeSchema);