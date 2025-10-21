import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReminder extends Document {
  userId: Types.ObjectId;
  title: string;
  dueAt: Date;
  notes?: string;
  plantId?: Types.ObjectId | null;
  completed: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  dueAt: { type: Date, required: true, index: true },
  notes: { type: String, trim: true, maxlength: 1000 },
  plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: false, default: null, index: true },
  completed: { type: Boolean, default: false, index: true },
  completedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, collection: 'reminders' });

ReminderSchema.index({ userId: 1, completed: 1, dueAt: 1 });

// Persist to the 'reminders' collection
const ReminderModel: mongoose.Model<IReminder> =
  (mongoose.models.Reminder as mongoose.Model<IReminder>) ||
  mongoose.model<IReminder>('Reminder', ReminderSchema, 'reminders');

export { ReminderModel as Reminder };
