// STUB MODEL - Original DashboardAnalytics collection has been removed from database
// This is a placeholder to prevent build errors in legacy code

import mongoose, { Document, Schema } from 'mongoose';

export enum DashboardWidgetType {
  CHART = 'chart',
  TABLE = 'table',
  STAT = 'stat',
  PLANT_OVERVIEW = 'plant_overview',
  CARE_SUMMARY = 'care_summary',
  REMINDER_STATUS = 'reminder_status',
  COMMUNITY_STATS = 'community_stats'
}

export enum RefreshFrequency {
  REALTIME = 'realtime',
  HOURLY = 'hourly',
  DAILY = 'daily'
}

export interface IDashboardAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  widgetType?: DashboardWidgetType;
  lastRefreshedAt?: Date;
  refreshFrequency?: RefreshFrequency;
  config?: any;
  shouldRefresh(): boolean;
  updateData(data: any): Promise<void>;
}

const dashboardAnalyticsSchema = new Schema<IDashboardAnalytics>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  widgetType: { type: String, enum: Object.values(DashboardWidgetType) },
  lastRefreshedAt: { type: Date },
  refreshFrequency: { type: String, enum: Object.values(RefreshFrequency) },
  config: { type: Schema.Types.Mixed }
}, { collection: 'dashboardanalytics_deleted' });

// Instance methods
dashboardAnalyticsSchema.methods.shouldRefresh = function(): boolean {
  return false;
};

dashboardAnalyticsSchema.methods.updateData = async function(data: any): Promise<void> {
  console.log(`[STUB] Dashboard analytics updated`);
};

export const DashboardAnalytics = mongoose.model<IDashboardAnalytics>('DashboardAnalytics', dashboardAnalyticsSchema);
