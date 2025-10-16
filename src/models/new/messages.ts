import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  fromEmail: string;
  fromName?: string;
  userId?: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  handled: boolean;
  createdAt: Date;
  migratedAt: Date;
  source: string;
}

const MessageSchema = new Schema<IMessage>({
  fromEmail: { type: String, required: true },
  fromName: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  handled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  migratedAt: { type: Date, default: Date.now },
  source: String
});

// Indexes
MessageSchema.index({ handled: 1, createdAt: -1 });
MessageSchema.index({ userId: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);