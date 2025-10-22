import mongoose, { Schema, Document } from 'mongoose';

export interface ICareLog extends Document {
  userId: mongoose.Types.ObjectId;
  plantId: mongoose.Types.ObjectId;
  careType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pestControl' | 'other';
  notes?: string;
  photos?: string[];
  careData?: Record<string, any>;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CareLogSchema = new Schema<ICareLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plantId: {
      type: Schema.Types.ObjectId,
      ref: 'Plant',
      required: true,
      index: true,
    },
    careType: {
      type: String,
      enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'pestControl', 'other'],
      required: true,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    photos: [{
      type: String,
    }],
    careData: {
      type: Schema.Types.Mixed,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

CareLogSchema.index({ userId: 1, date: -1 });
CareLogSchema.index({ plantId: 1, date: -1 });
CareLogSchema.index({ userId: 1, plantId: 1, careType: 1 });

const CareLog = mongoose.model<ICareLog>('CareLog', CareLogSchema);

export default CareLog;
