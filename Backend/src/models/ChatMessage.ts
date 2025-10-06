import mongoose, { Document, Schema, Model } from 'mongoose';

// Chat Message Role
export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

// ChatMessage interface
export interface IChatMessage extends Document {
  // Relations
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  
  // Message content
  role: ChatMessageRole;
  content: string;
  
  // Context metadata
  metadata?: {
    plantId?: mongoose.Types.ObjectId;
    careType?: string;
    suggestions?: string[];
    confidence?: number;
    intent?: string;
    entities?: {
      type: string;
      value: string;
    }[];
  };
  
  // AI Model info
  aiModel?: string;
  tokens?: number;
  
  // Feedback
  helpful?: boolean;
  feedbackComment?: string;
  
  // Timestamps
  createdAt: Date;
}

// Model interface for statics
export interface IChatMessageModel extends Model<IChatMessage> {
  getChatHistory(userId: mongoose.Types.ObjectId, sessionId: string, limit?: number): Promise<IChatMessage[]>;
  getRecentSessions(userId: mongoose.Types.ObjectId, limit?: number): Promise<any[]>;
}

// ChatMessage schema
const chatMessageSchema = new Schema<IChatMessage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  
  role: {
    type: String,
    enum: Object.values(ChatMessageRole),
    required: [true, 'Message role is required']
  },
  
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [4000, 'Message content must not exceed 4000 characters']
  },
  
  metadata: {
    plantId: {
      type: Schema.Types.ObjectId,
      ref: 'Plant'
    },
    careType: String,
    suggestions: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    intent: String,
    entities: [{
      type: {
        type: String
      },
      value: String
    }]
  },
  
  aiModel: {
    type: String,
    default: 'gemini-pro'
  },
  
  tokens: {
    type: Number,
    min: 0
  },
  
  helpful: Boolean,
  feedbackComment: {
    type: String,
    maxlength: [500, 'Feedback comment must not exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, sessionId: 1 });

// TTL index to automatically delete old chat messages after 90 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to get chat history
chatMessageSchema.statics.getChatHistory = function(
  userId: mongoose.Types.ObjectId,
  sessionId: string,
  limit: number = 50
) {
  return this.find({ userId, sessionId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
};

// Static method to get user's recent sessions
chatMessageSchema.statics.getRecentSessions = function(
  userId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.aggregate([
    { $match: { userId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$sessionId',
        lastMessage: { $first: '$$ROOT' },
        messageCount: { $sum: 1 }
      }
    },
    { $limit: limit },
    { $sort: { 'lastMessage.createdAt': -1 } }
  ]);
};

// Create and export model
export const ChatMessage = mongoose.model<IChatMessage, IChatMessageModel>('ChatMessage', chatMessageSchema);
