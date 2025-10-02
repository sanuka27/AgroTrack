import mongoose, { Document, Schema } from 'mongoose';

// Export/Import Operation Interface
export interface IExportImportOperation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  operationType: 'export' | 'import';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  exportId?: string;
  format: 'json' | 'csv' | 'both';
  dataTypes: string[];
  options: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    includeMedia?: boolean;
    overwrite?: boolean;
    validateOnly?: boolean;
  };
  fileInfo?: {
    originalName?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
  results?: {
    recordCounts?: {
      plants?: number;
      careLogs?: number;
      reminders?: number;
      posts?: number;
      notifications?: number;
      comments?: number;
    };
    imported?: {
      plants?: number;
      careLogs?: number;
      reminders?: number;
      posts?: number;
      notifications?: number;
    };
    errors?: string[];
    warnings?: string[];
  };
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  downloadCount?: number;
  lastDownloadAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Export/Import Operation Schema
const exportImportOperationSchema = new Schema<IExportImportOperation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  operationType: {
    type: String,
    enum: ['export', 'import'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  exportId: {
    type: String,
    sparse: true,
    index: true
  },
  format: {
    type: String,
    enum: ['json', 'csv', 'both'],
    required: true
  },
  dataTypes: [{
    type: String,
    enum: ['profile', 'preferences', 'plants', 'careLogs', 'reminders', 'posts', 'notifications', 'comments'],
    required: true
  }],
  options: {
    dateRange: {
      start: Date,
      end: Date
    },
    includeMedia: {
      type: Boolean,
      default: false
    },
    overwrite: {
      type: Boolean,
      default: false
    },
    validateOnly: {
      type: Boolean,
      default: false
    }
  },
  fileInfo: {
    originalName: String,
    fileName: String,
    fileSize: Number,
    mimeType: String
  },
  results: {
    recordCounts: {
      plants: { type: Number, default: 0 },
      careLogs: { type: Number, default: 0 },
      reminders: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      notifications: { type: Number, default: 0 },
      comments: { type: Number, default: 0 }
    },
    imported: {
      plants: { type: Number, default: 0 },
      careLogs: { type: Number, default: 0 },
      reminders: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      notifications: { type: Number, default: 0 }
    },
    errors: [String],
    warnings: [String]
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  duration: Number,
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadAt: Date,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
exportImportOperationSchema.index({ userId: 1, createdAt: -1 });
exportImportOperationSchema.index({ userId: 1, operationType: 1, status: 1 });
exportImportOperationSchema.index({ exportId: 1 }, { sparse: true });
exportImportOperationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance Methods
exportImportOperationSchema.methods.markAsStarted = function(): void {
  this.status = 'in-progress';
  this.startedAt = new Date();
};

exportImportOperationSchema.methods.markAsCompleted = function(results?: any): void {
  this.status = 'completed';
  this.completedAt = new Date();
  this.duration = this.completedAt.getTime() - this.startedAt.getTime();
  if (results) {
    this.results = { ...this.results, ...results };
  }
  
  // Set expiration for export files (30 days for exports, immediate for imports)
  if (this.operationType === 'export') {
    this.expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  }
};

exportImportOperationSchema.methods.markAsFailed = function(error: string): void {
  this.status = 'failed';
  this.completedAt = new Date();
  this.duration = this.completedAt.getTime() - this.startedAt.getTime();
  
  if (!this.results) this.results = {};
  if (!this.results.errors) this.results.errors = [];
  this.results.errors.push(error);
};

exportImportOperationSchema.methods.incrementDownloadCount = function(): void {
  this.downloadCount = (this.downloadCount || 0) + 1;
  this.lastDownloadAt = new Date();
};

// Static Methods
exportImportOperationSchema.statics.getUserOperations = function(
  userId: mongoose.Types.ObjectId, 
  operationType?: 'export' | 'import',
  limit: number = 20
) {
  const query: any = { userId };
  if (operationType) query.operationType = operationType;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-results.errors -results.warnings'); // Exclude detailed errors for list view
};

exportImportOperationSchema.statics.getOperationStats = async function(userId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalExports: {
          $sum: {
            $cond: [{ $eq: ['$operationType', 'export'] }, 1, 0]
          }
        },
        totalImports: {
          $sum: {
            $cond: [{ $eq: ['$operationType', 'import'] }, 1, 0]
          }
        },
        successfulExports: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$operationType', 'export'] }, { $eq: ['$status', 'completed'] }] },
              1,
              0
            ]
          }
        },
        successfulImports: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$operationType', 'import'] }, { $eq: ['$status', 'completed'] }] },
              1,
              0
            ]
          }
        },
        totalDownloads: { $sum: '$downloadCount' },
        lastExportAt: {
          $max: {
            $cond: [{ $eq: ['$operationType', 'export'] }, '$createdAt', null]
          }
        },
        lastImportAt: {
          $max: {
            $cond: [{ $eq: ['$operationType', 'import'] }, '$createdAt', null]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalExports: 0,
    totalImports: 0,
    successfulExports: 0,
    successfulImports: 0,
    totalDownloads: 0,
    lastExportAt: null,
    lastImportAt: null
  };
};

exportImportOperationSchema.statics.cleanupExpiredOperations = async function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old

  const result = await this.deleteMany({
    status: 'completed',
    operationType: 'export',
    createdAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

exportImportOperationSchema.statics.getActiveOperations = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    userId,
    status: { $in: ['pending', 'in-progress'] }
  }).sort({ createdAt: -1 });
};

// Pre-save middleware to set default expiration
exportImportOperationSchema.pre('save', function(next) {
  if (this.isNew && this.operationType === 'import') {
    // Import operations don't need long-term storage
    this.expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 1 day
  }
  next();
});

// Export the model
export const ExportImportOperation = mongoose.model<IExportImportOperation>('ExportImportOperation', exportImportOperationSchema);