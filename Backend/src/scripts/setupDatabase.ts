import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import all models to ensure they're registered
import '../models/User';
import '../models/Plant';
import '../models/CareLog';
import '../models/Reminder';
import '../models/Notification';
import '../models/NotificationPreference';
import '../models/UserAnalytics';
import '../models/PlantCareAnalytics';
import '../models/SystemMetrics';
import '../models/DashboardAnalytics';
import '../models/SearchAnalytics';
import '../models/BlogPost';
import '../models/BlogCategory';
import '../models/BlogTag';
import '../models/BlogSeries';
import '../models/Post';
import '../models/Comment';
import '../models/Like';
import '../models/ExportImportOperation';
import '../models/BugReport';
import '../models/ContactMessage';
import '../models/ChatMessage';

// Helper function to create index safely
const createIndexSafely = async (collection: any, indexSpec: any) => {
  try {
    await collection.createIndex(indexSpec.key, {
      name: indexSpec.name,
      unique: indexSpec.unique || false,
      sparse: indexSpec.sparse || false
    });
    console.log(`✅ Created index: ${indexSpec.name}`);
  } catch (error: any) {
    if (error.code === 85) {
      console.log(`ℹ️ Index already exists: ${indexSpec.name}`);
    } else {
      console.log(`⚠️ Failed to create index ${indexSpec.name}:`, error.message);
    }
  }
};

const setupDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB successfully');

    // Get database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Failed to get database instance');
    }

    console.log('📦 Setting up collections and indexes...');

    // User collection indexes
    const userCollection = db.collection('users');
    await createIndexSafely(userCollection, { key: { email: 1 }, unique: true, name: 'email_unique' });
    await createIndexSafely(userCollection, { key: { firebaseUid: 1 }, sparse: true, name: 'firebase_uid' });
    await createIndexSafely(userCollection, { key: { googleId: 1 }, sparse: true, name: 'google_id' });
    await createIndexSafely(userCollection, { key: { role: 1 }, name: 'role_index' });
    await createIndexSafely(userCollection, { key: { isActive: 1 }, name: 'active_users' });
    await createIndexSafely(userCollection, { key: { lastLoginAt: -1 }, name: 'last_login' });
    await createIndexSafely(userCollection, { key: { createdAt: -1 }, name: 'created_at' });
    console.log('✅ User collection indexes processed');

    // Plant collection indexes
    const plantCollection = db.collection('plants');
    await createIndexSafely(plantCollection, { key: { userId: 1 }, name: 'user_plants' });
    await createIndexSafely(plantCollection, { key: { category: 1 }, name: 'plant_category' });
    await createIndexSafely(plantCollection, { key: { health: 1 }, name: 'plant_health' });
    await createIndexSafely(plantCollection, { key: { createdAt: -1 }, name: 'plant_created' });
    await createIndexSafely(plantCollection, { key: { userId: 1, category: 1 }, name: 'user_category' });
    await createIndexSafely(plantCollection, { key: { name: 'text', scientificName: 'text', description: 'text' }, name: 'plant_text_search' });
    console.log('✅ Plant collection indexes processed');

    // CareLog collection indexes
    const careLogCollection = db.collection('carelogs');
    await createIndexSafely(careLogCollection, { key: { plantId: 1 }, name: 'plant_care_logs' });
    await createIndexSafely(careLogCollection, { key: { userId: 1 }, name: 'user_care_logs' });
    await createIndexSafely(careLogCollection, { key: { date: -1 }, name: 'care_date' });
    await createIndexSafely(careLogCollection, { key: { type: 1 }, name: 'care_type' });
    await createIndexSafely(careLogCollection, { key: { plantId: 1, date: -1 }, name: 'plant_care_timeline' });
    await createIndexSafely(careLogCollection, { key: { createdAt: -1 }, name: 'care_created' });
    console.log('✅ CareLog collection indexes processed');

    // Reminder collection indexes
    const reminderCollection = db.collection('reminders');
    await createIndexSafely(reminderCollection, { key: { userId: 1 }, name: 'user_reminders' });
    await createIndexSafely(reminderCollection, { key: { plantId: 1 }, name: 'plant_reminders' });
    await createIndexSafely(reminderCollection, { key: { dueDate: 1 }, name: 'due_date' });
    await createIndexSafely(reminderCollection, { key: { status: 1 }, name: 'reminder_status' });
    await createIndexSafely(reminderCollection, { key: { priority: 1 }, name: 'reminder_priority' });
    await createIndexSafely(reminderCollection, { key: { userId: 1, dueDate: 1 }, name: 'user_due_reminders' });
    await createIndexSafely(reminderCollection, { key: { createdAt: -1 }, name: 'reminder_created' });
    console.log('✅ Reminder collection indexes processed');

    // Notification collection indexes
    const notificationCollection = db.collection('notifications');
    await createIndexSafely(notificationCollection, { key: { userId: 1 }, name: 'user_notifications' });
    await createIndexSafely(notificationCollection, { key: { type: 1 }, name: 'notification_type' });
    await createIndexSafely(notificationCollection, { key: { isRead: 1 }, name: 'read_status' });
    await createIndexSafely(notificationCollection, { key: { createdAt: -1 }, name: 'notification_created' });
    await createIndexSafely(notificationCollection, { key: { userId: 1, isRead: 1, createdAt: -1 }, name: 'user_unread_notifications' });
    console.log('✅ Notification collection indexes processed');

    // Analytics collections indexes
    const userAnalyticsCollection = db.collection('useranalytics');
    await createIndexSafely(userAnalyticsCollection, { key: { userId: 1 }, name: 'user_analytics' });
    await createIndexSafely(userAnalyticsCollection, { key: { date: 1 }, name: 'analytics_date' });
    await createIndexSafely(userAnalyticsCollection, { key: { userId: 1, date: 1 }, unique: true, name: 'user_date_unique' });

    const plantAnalyticsCollection = db.collection('plantcareanalytics');
    await createIndexSafely(plantAnalyticsCollection, { key: { userId: 1 }, name: 'user_plant_analytics' });
    await createIndexSafely(plantAnalyticsCollection, { key: { plantId: 1 }, name: 'plant_analytics' });
    await createIndexSafely(plantAnalyticsCollection, { key: { date: 1 }, name: 'plant_analytics_date' });

    const systemMetricsCollection = db.collection('systemmetrics');
    await createIndexSafely(systemMetricsCollection, { key: { date: 1 }, unique: true, name: 'system_metrics_date' });
    await createIndexSafely(systemMetricsCollection, { key: { metric: 1 }, name: 'metric_type' });

    const dashboardAnalyticsCollection = db.collection('dashboardanalytics');
    await createIndexSafely(dashboardAnalyticsCollection, { key: { userId: 1 }, name: 'user_dashboard' });
    await createIndexSafely(dashboardAnalyticsCollection, { key: { date: 1 }, name: 'dashboard_date' });

    const searchAnalyticsCollection = db.collection('searchanalytics');
    await createIndexSafely(searchAnalyticsCollection, { key: { userId: 1 }, name: 'user_search' });
    await createIndexSafely(searchAnalyticsCollection, { key: { query: 1 }, name: 'search_query' });
    await createIndexSafely(searchAnalyticsCollection, { key: { createdAt: -1 }, name: 'search_created' });
    console.log('✅ Analytics collections indexes processed');

    // Blog collections indexes
    const blogPostCollection = db.collection('blogposts');
    await createIndexSafely(blogPostCollection, { key: { authorId: 1 }, name: 'blog_author' });
    await createIndexSafely(blogPostCollection, { key: { status: 1 }, name: 'blog_status' });
    await createIndexSafely(blogPostCollection, { key: { publishedAt: -1 }, name: 'blog_published' });
    await createIndexSafely(blogPostCollection, { key: { categoryId: 1 }, name: 'blog_category' });
    await createIndexSafely(blogPostCollection, { key: { tags: 1 }, name: 'blog_tags' });
    await createIndexSafely(blogPostCollection, { key: { title: 'text', content: 'text', excerpt: 'text' }, name: 'blog_text_search' });

    const blogCategoryCollection = db.collection('blogcategories');
    await createIndexSafely(blogCategoryCollection, { key: { name: 1 }, unique: true, name: 'category_name_unique' });
    await createIndexSafely(blogCategoryCollection, { key: { slug: 1 }, unique: true, name: 'category_slug_unique' });

    const blogTagCollection = db.collection('blogtags');
    await createIndexSafely(blogTagCollection, { key: { name: 1 }, unique: true, name: 'tag_name_unique' });
    await createIndexSafely(blogTagCollection, { key: { slug: 1 }, unique: true, name: 'tag_slug_unique' });
    console.log('✅ Blog collections indexes processed');

    // Community collections indexes
    const postCollection = db.collection('posts');
    await createIndexSafely(postCollection, { key: { authorId: 1 }, name: 'post_author' });
    await createIndexSafely(postCollection, { key: { type: 1 }, name: 'post_type' });
    await createIndexSafely(postCollection, { key: { status: 1 }, name: 'post_status' });
    await createIndexSafely(postCollection, { key: { createdAt: -1 }, name: 'post_created' });
    await createIndexSafely(postCollection, { key: { title: 'text', content: 'text' }, name: 'post_text_search' });

    const commentCollection = db.collection('comments');
    await createIndexSafely(commentCollection, { key: { postId: 1 }, name: 'post_comments' });
    await createIndexSafely(commentCollection, { key: { authorId: 1 }, name: 'comment_author' });
    await createIndexSafely(commentCollection, { key: { parentId: 1 }, sparse: true, name: 'parent_comment' });
    await createIndexSafely(commentCollection, { key: { createdAt: -1 }, name: 'comment_created' });

    const likeCollection = db.collection('likes');
    await createIndexSafely(likeCollection, { key: { userId: 1 }, name: 'user_likes' });
    await createIndexSafely(likeCollection, { key: { postId: 1 }, name: 'post_likes' });
    await createIndexSafely(likeCollection, { key: { commentId: 1 }, sparse: true, name: 'comment_likes' });
    await createIndexSafely(likeCollection, { key: { userId: 1, postId: 1 }, unique: true, name: 'user_post_like_unique' });
    console.log('✅ Community collections indexes processed');

    // Export/Import operations
    const exportImportCollection = db.collection('exportimportoperations');
    await createIndexSafely(exportImportCollection, { key: { userId: 1 }, name: 'user_operations' });
    await createIndexSafely(exportImportCollection, { key: { type: 1 }, name: 'operation_type' });
    await createIndexSafely(exportImportCollection, { key: { status: 1 }, name: 'operation_status' });
    await createIndexSafely(exportImportCollection, { key: { createdAt: -1 }, name: 'operation_created' });
    console.log('✅ Export/Import collection indexes processed');

    // BugReport collection indexes
    const bugReportCollection = db.collection('bugreports');
    await createIndexSafely(bugReportCollection, { key: { status: 1, createdAt: -1 }, name: 'bug_status_created' });
    await createIndexSafely(bugReportCollection, { key: { priority: 1, status: 1 }, name: 'bug_priority_status' });
    await createIndexSafely(bugReportCollection, { key: { assignedTo: 1 }, sparse: true, name: 'bug_assigned' });
    await createIndexSafely(bugReportCollection, { key: { userId: 1 }, sparse: true, name: 'bug_user' });
    await createIndexSafely(bugReportCollection, { key: { email: 1 }, name: 'bug_email' });
    console.log('✅ BugReport collection indexes processed');

    // ContactMessage collection indexes
    const contactMessageCollection = db.collection('contactmessages');
    await createIndexSafely(contactMessageCollection, { key: { status: 1, createdAt: -1 }, name: 'contact_status_created' });
    await createIndexSafely(contactMessageCollection, { key: { priority: 1, status: 1 }, name: 'contact_priority_status' });
    await createIndexSafely(contactMessageCollection, { key: { userId: 1 }, sparse: true, name: 'contact_user' });
    await createIndexSafely(contactMessageCollection, { key: { email: 1 }, name: 'contact_email' });
    await createIndexSafely(contactMessageCollection, { key: { respondedBy: 1 }, sparse: true, name: 'contact_responder' });
    console.log('✅ ContactMessage collection indexes processed');

    // ChatMessage collection indexes
    const chatMessageCollection = db.collection('chatmessages');
    await createIndexSafely(chatMessageCollection, { key: { userId: 1, createdAt: -1 }, name: 'chat_user_created' });
    await createIndexSafely(chatMessageCollection, { key: { sessionId: 1, createdAt: 1 }, name: 'chat_session_timeline' });
    await createIndexSafely(chatMessageCollection, { key: { userId: 1, sessionId: 1 }, name: 'chat_user_session' });
    await createIndexSafely(chatMessageCollection, { key: { createdAt: 1 }, expireAfterSeconds: 7776000, name: 'chat_ttl' }); // 90 days TTL
    console.log('✅ ChatMessage collection indexes processed (with 90-day TTL)');

    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Collections and indexes have been created.');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📦 Total collections: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the setup
setupDatabase();