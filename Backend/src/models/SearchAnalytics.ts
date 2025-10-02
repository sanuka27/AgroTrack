import mongoose, { Document, Schema } from 'mongoose';

// Search Analytics Interface
export interface ISearchAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  searchQuery: string;
  contentTypes: string[];
  filters: {
    categories?: string[];
    tags?: string[];
    careTypes?: string[];
    healthStatus?: string[];
    location?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  resultCount: number;
  executionTime: number; // in milliseconds
  selectedResults?: {
    resultId: string;
    resultType: string;
    position: number;
    clickedAt: Date;
  }[];
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Popular Search Terms Interface
export interface IPopularSearchTerm extends Document {
  _id: mongoose.Types.ObjectId;
  term: string;
  searchCount: number;
  lastSearched: Date;
  averageResultCount: number;
  averageExecutionTime: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for PopularSearchTerm model with static methods
interface IPopularSearchTermModel extends mongoose.Model<IPopularSearchTerm> {
  updateSearchTerm(term: string, resultCount: number, executionTime: number): Promise<IPopularSearchTerm>;
  getPopularTerms(limit?: number): mongoose.Query<IPopularSearchTerm[], IPopularSearchTerm>;
  getTrendingTerms(days?: number, limit?: number): mongoose.Query<IPopularSearchTerm[], IPopularSearchTerm>;
  getSuggestions(query: string, limit?: number): mongoose.Query<IPopularSearchTerm[], IPopularSearchTerm>;
}

// Search Analytics Schema
const searchAnalyticsSchema = new Schema<ISearchAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  searchQuery: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  contentTypes: [{
    type: String,
    enum: ['plants', 'careLogs', 'reminders', 'posts'],
    required: true
  }],
  filters: {
    categories: [String],
    tags: [String],
    careTypes: [{
      type: String,
      enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'pest-treatment', 'disease-treatment', 'general', 'observation']
    }],
    healthStatus: [{
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical']
    }],
    location: String,
    dateRange: {
      start: Date,
      end: Date
    }
  },
  resultCount: {
    type: Number,
    required: true,
    min: 0
  },
  executionTime: {
    type: Number,
    required: true,
    min: 0
  },
  selectedResults: [{
    resultId: {
      type: String,
      required: true
    },
    resultType: {
      type: String,
      enum: ['plant', 'careLog', 'reminder', 'post'],
      required: true
    },
    position: {
      type: Number,
      required: true,
      min: 0
    },
    clickedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sessionId: String,
  userAgent: String,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
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

// Popular Search Terms Schema
const popularSearchTermSchema = new Schema<IPopularSearchTerm>({
  term: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
    index: true
  },
  searchCount: {
    type: Number,
    default: 1,
    min: 1
  },
  lastSearched: {
    type: Date,
    default: Date.now,
    index: true
  },
  averageResultCount: {
    type: Number,
    default: 0,
    min: 0
  },
  averageExecutionTime: {
    type: Number,
    default: 0,
    min: 0
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
searchAnalyticsSchema.index({ userId: 1, timestamp: -1 });
searchAnalyticsSchema.index({ searchQuery: 1, userId: 1 });
searchAnalyticsSchema.index({ timestamp: -1 });
searchAnalyticsSchema.index({ contentTypes: 1, timestamp: -1 });

popularSearchTermSchema.index({ searchCount: -1 });
popularSearchTermSchema.index({ lastSearched: -1 });

// Instance Methods for SearchAnalytics
searchAnalyticsSchema.methods.addSelectedResult = function(resultId: string, resultType: string, position: number): void {
  if (!this.selectedResults) this.selectedResults = [];
  
  this.selectedResults.push({
    resultId,
    resultType,
    position,
    clickedAt: new Date()
  });
};

// Static Methods for SearchAnalytics
searchAnalyticsSchema.statics.trackSearch = async function(
  userId: mongoose.Types.ObjectId,
  searchQuery: string,
  contentTypes: string[],
  filters: any,
  resultCount: number,
  executionTime: number,
  sessionId?: string,
  userAgent?: string,
  ipAddress?: string
) {
  try {
    // Create search analytics record
    const searchAnalytics = new this({
      userId,
      searchQuery: searchQuery.trim(),
      contentTypes,
      filters,
      resultCount,
      executionTime,
      sessionId,
      userAgent,
      ipAddress
    });

    await searchAnalytics.save();

    // Update popular search terms
    if (searchQuery.trim()) {
      await PopularSearchTerm.updateSearchTerm(searchQuery.trim(), resultCount, executionTime);
    }

    return searchAnalytics;
  } catch (error) {
    console.error('Error tracking search:', error);
    throw error;
  }
};

searchAnalyticsSchema.statics.getUserSearchHistory = function(
  userId: mongoose.Types.ObjectId,
  limit: number = 20
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('searchQuery contentTypes resultCount timestamp');
};

searchAnalyticsSchema.statics.getSearchTrends = async function(
  userId?: mongoose.Types.ObjectId,
  days: number = 7
) {
  const matchStage: any = {
    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  };
  
  if (userId) {
    matchStage.userId = userId;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          query: '$searchQuery',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 },
        avgResultCount: { $avg: '$resultCount' },
        avgExecutionTime: { $avg: '$executionTime' }
      }
    },
    {
      $group: {
        _id: '$_id.query',
        totalSearches: { $sum: '$count' },
        avgResultCount: { $avg: '$avgResultCount' },
        avgExecutionTime: { $avg: '$avgExecutionTime' },
        searchDates: {
          $push: {
            date: '$_id.date',
            count: '$count'
          }
        }
      }
    },
    { $sort: { totalSearches: -1 } },
    { $limit: 20 }
  ]);
};

searchAnalyticsSchema.statics.getContentTypeStats = function(
  userId?: mongoose.Types.ObjectId,
  days: number = 30
) {
  const matchStage: any = {
    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  };
  
  if (userId) {
    matchStage.userId = userId;
  }

  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$contentTypes' },
    {
      $group: {
        _id: '$contentTypes',
        searchCount: { $sum: 1 },
        avgResultCount: { $avg: '$resultCount' },
        avgExecutionTime: { $avg: '$executionTime' }
      }
    },
    { $sort: { searchCount: -1 } }
  ]);
};

// Static Methods for PopularSearchTerm
popularSearchTermSchema.statics.updateSearchTerm = async function(
  term: string,
  resultCount: number,
  executionTime: number
) {
  const cleanTerm = term.toLowerCase().trim();
  
  try {
    const existingTerm = await this.findOne({ term: cleanTerm });
    
    if (existingTerm) {
      // Update existing term
      const newCount = existingTerm.searchCount + 1;
      const newAvgResultCount = (existingTerm.averageResultCount * existingTerm.searchCount + resultCount) / newCount;
      const newAvgExecutionTime = (existingTerm.averageExecutionTime * existingTerm.searchCount + executionTime) / newCount;
      
      existingTerm.searchCount = newCount;
      existingTerm.averageResultCount = newAvgResultCount;
      existingTerm.averageExecutionTime = newAvgExecutionTime;
      existingTerm.lastSearched = new Date();
      
      await existingTerm.save();
      return existingTerm;
    } else {
      // Create new term
      const newTerm = new this({
        term: cleanTerm,
        searchCount: 1,
        averageResultCount: resultCount,
        averageExecutionTime: executionTime,
        lastSearched: new Date()
      });
      
      await newTerm.save();
      return newTerm;
    }
  } catch (error) {
    console.error('Error updating search term:', error);
    throw error;
  }
};

popularSearchTermSchema.statics.getPopularTerms = function(limit: number = 20) {
  return this.find()
    .sort({ searchCount: -1, lastSearched: -1 })
    .limit(limit)
    .select('term searchCount lastSearched averageResultCount');
};

popularSearchTermSchema.statics.getTrendingTerms = function(days: number = 7, limit: number = 10) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    lastSearched: { $gte: cutoffDate }
  })
    .sort({ searchCount: -1, lastSearched: -1 })
    .limit(limit)
    .select('term searchCount lastSearched');
};

popularSearchTermSchema.statics.getSuggestions = function(query: string, limit: number = 10) {
  return this.find({
    term: { $regex: query, $options: 'i' }
  })
    .sort({ searchCount: -1 })
    .limit(limit)
    .select('term searchCount');
};

// Pre-save middleware to clean up old records
searchAnalyticsSchema.pre('save', function(next) {
  // Could add logic to clean up old analytics records
  next();
});

// Export the models
export const SearchAnalytics = mongoose.model<ISearchAnalytics>('SearchAnalytics', searchAnalyticsSchema);
export const PopularSearchTerm = mongoose.model<IPopularSearchTerm, IPopularSearchTermModel>('PopularSearchTerm', popularSearchTermSchema);