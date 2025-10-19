// STUB MODEL - Original ExportImportOperation collection has been removed from database
// This is a placeholder to prevent build errors in legacy code

import mongoose, { Document, Schema } from 'mongoose';

export interface IExportImportOperation extends Document {
  userId: mongoose.Types.ObjectId;
  operationType?: string;
  status?: string;
  exportId?: string;
  format?: string;
  dataTypes?: string[];
  options?: any;
  fileInfo?: any;
  results?: any;
  downloadCount?: number;
  lastDownloadAt?: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  expiresAt?: Date;
  updatedAt: Date;
}

const exportImportOperationSchema = new Schema<IExportImportOperation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  operationType: { type: String },
  status: { type: String },
  exportId: { type: String },
  format: { type: String },
  dataTypes: [{ type: String }],
  options: Schema.Types.Mixed,
  fileInfo: Schema.Types.Mixed,
  results: Schema.Types.Mixed,
  downloadCount: { type: Number, default: 0 },
  lastDownloadAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  duration: { type: Number },
  expiresAt: { type: Date }
}, { 
  collection: 'exportimportoperations_deleted',
  timestamps: true 
});

export const ExportImportOperation = mongoose.model<IExportImportOperation>('ExportImportOperation', exportImportOperationSchema);
