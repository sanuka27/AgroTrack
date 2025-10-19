// STUB MODEL - Original PlantCareAnalytics collection has been removed from database
// This is a placeholder to prevent build errors in legacy code

import mongoose, { Document, Schema } from 'mongoose';

export interface IPlantCareAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
}

const plantCareAnalyticsSchema = new Schema<IPlantCareAnalytics>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'plantcareanalytics_deleted' });

export const PlantCareAnalytics = mongoose.model<IPlantCareAnalytics>('PlantCareAnalytics', plantCareAnalyticsSchema);
