import mongoose from 'mongoose';

// Generic mapping utilities
export function safeObjectId(id: any): mongoose.Types.ObjectId | undefined {
  if (!id) return undefined;
  try {
    return new mongoose.Types.ObjectId(id.toString());
  } catch {
    return undefined;
  }
}

export function normalizeEmail(email: string): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim().toLowerCase();
  return trimmed || undefined;
}

export function normalizeRoles(roles: any): string[] {
  if (!Array.isArray(roles)) {
    const role = typeof roles === 'string' ? roles : 'member';
    return [role];
  }
  return roles.filter(r => typeof r === 'string' && r.length > 0);
}

// User mapping functions
export function mapLegacyUser(legacyUser: any, source: 'users' | 'communityusers') {
  const mapped = {
    firebaseUid: legacyUser.firebaseUid || legacyUser.uid,
    email: normalizeEmail(legacyUser.email),
    phone: legacyUser.phone,
    name: legacyUser.name || legacyUser.displayName,
    roles: normalizeRoles(legacyUser.role || legacyUser.roles || ['member']),
    sourceIds: source === 'users'
      ? { users: safeObjectId(legacyUser._id) }
      : { communityusers: safeObjectId(legacyUser._id) },
    createdAt: legacyUser.createdAt || new Date(),
    updatedAt: legacyUser.updatedAt || legacyUser.createdAt || new Date(),
    migratedAt: new Date(),
    source
  };
  return mapped;
}

// Post mapping functions
export async function mapCommunityPost(
  post: any,
  comments: any[],
  votes: any[]
): Promise<any> {
  const voteCount = votes.length;
  const voterIds = voteCount < 5000 ? votes.map(v => safeObjectId(v.userId)).filter(Boolean) : undefined;

  const mappedComments = comments.map(c => ({
    _id: safeObjectId(c._id),
    authorId: safeObjectId(c.authorId || c.userId),
    body: c.body || c.content || c.text,
    createdAt: c.createdAt || new Date()
  })).filter(c => c.authorId && c.body);

  return {
    sourceId: safeObjectId(post._id),
    authorId: safeObjectId(post.authorId || post.userId),
    title: post.title || 'Untitled Post',
    body: post.body || post.content || post.description || '',
    images: Array.isArray(post.images) ? post.images : [],
    tags: Array.isArray(post.tags) ? post.tags : [],
    createdAt: post.createdAt || new Date(),
    updatedAt: post.updatedAt || post.createdAt || new Date(),
    comments: mappedComments,
    voteCount,
    voterIds,
    migratedAt: new Date(),
    source: 'communityposts'
  };
}

// Analytics mapping functions
export function mapUserAnalytics(analytics: any) {
  return {
    type: 'user' as const,
    userId: safeObjectId(analytics.userId),
    record: analytics,
    createdAt: analytics.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'useranalytics'
  };
}

export function mapSystemMetrics(metrics: any) {
  return {
    type: 'system' as const,
    record: metrics,
    createdAt: metrics.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'systemmetrics'
  };
}

export function mapDashboardAnalytics(analytics: any) {
  return {
    type: 'dashboard' as const,
    userId: safeObjectId(analytics.userId),
    record: analytics,
    createdAt: analytics.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'dashboardanalytics'
  };
}

export function mapSearchAnalytics(analytics: any) {
  return {
    type: 'search' as const,
    userId: safeObjectId(analytics.userId),
    record: analytics,
    createdAt: analytics.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'searchanalytics'
  };
}

// Plant log mapping functions
export function mapCareLog(log: any) {
  return {
    plantId: safeObjectId(log.plantId),
    userId: safeObjectId(log.userId),
    type: 'care' as const,
    details: log,
    occurredAt: log.careDate || log.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'carelogs'
  };
}

export function mapPlantAnalytics(analytics: any) {
  return {
    plantId: safeObjectId(analytics.plantId),
    userId: safeObjectId(analytics.userId),
    type: 'analytics' as const,
    details: analytics,
    occurredAt: analytics.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'plantcareanalytics'
  };
}

export function mapReminder(reminder: any) {
  return {
    plantId: safeObjectId(reminder.plantId),
    userId: safeObjectId(reminder.userId),
    type: 'reminder' as const,
    details: reminder,
    occurredAt: reminder.dueDate || reminder.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'reminders'
  };
}

// Blog mapping functions
export async function mapBlogPost(
  post: any,
  tags: any[] = [],
  categories: any[] = [],
  series: any[] = []
): Promise<any> {
  const tagNames = tags.map(t => t.name || t).filter(Boolean);
  const categoryName = categories.find(c => c._id?.toString() === post.categoryId?.toString())?.name;
  const seriesName = series.find(s => s._id?.toString() === post.seriesId?.toString())?.name;

  return {
    title: post.title,
    slug: post.slug || generateSlug(post.title),
    body: post.body || post.content,
    tags: tagNames,
    category: categoryName,
    series: seriesName,
    authorId: safeObjectId(post.authorId),
    createdAt: post.createdAt || new Date(),
    updatedAt: post.updatedAt || post.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'blogposts'
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Notification mapping functions
export async function mapNotification(
  notification: any,
  preferences: any = {}
): Promise<any> {
  return {
    userId: safeObjectId(notification.userId),
    type: notification.type,
    title: notification.title,
    message: notification.message || notification.body,
    data: notification.data,
    read: notification.read || false,
    preferences: {
      email: preferences.email !== false,
      push: preferences.push !== false,
      inApp: preferences.inApp !== false
    },
    createdAt: notification.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'notifications'
  };
}

// Message mapping functions
export function mapContactMessage(message: any) {
  return {
    fromEmail: message.email || message.fromEmail,
    fromName: message.name || message.fromName,
    userId: safeObjectId(message.userId),
    subject: message.subject,
    body: message.message || message.body,
    handled: message.handled || false,
    createdAt: message.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'contactmessages'
  };
}

// Report mapping functions
export function mapCommunityReport(report: any) {
  return {
    kind: 'community' as const,
    reporterId: safeObjectId(report.reporterUid || report.reporterId),
    postId: safeObjectId(report.targetId),
    severity: report.severity || 'medium',
    status: report.status || 'pending',
    details: {
      reason: report.reason,
      description: report.description,
      targetType: report.targetType
    },
    createdAt: report.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'communityreports'
  };
}

export function mapBugReport(report: any) {
  return {
    kind: 'bug' as const,
    reporterId: safeObjectId(report.userId),
    severity: report.severity || 'medium',
    status: report.status || 'pending',
    details: {
      title: report.title,
      description: report.description,
      steps: report.steps,
      environment: report.environment
    },
    createdAt: report.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'bugreports'
  };
}

// System log mapping functions
export function mapExportImportOperation(operation: any) {
  return {
    action: operation.action || 'export_import',
    actorId: safeObjectId(operation.userId),
    payload: operation,
    createdAt: operation.createdAt || new Date(),
    migratedAt: new Date(),
    source: 'exportimportoperations'
  };
}

// Plant mapping functions
export function mapPlant(plant: any) {
  return {
    ...plant,
    _id: plant._id, // Keep original ID
    migratedAt: new Date(),
    source: 'plants'
  };
}