import mongoose from 'mongoose';
import { Plant } from '../models/Plant';
import { CareLog } from '../models/CareLog';
import { Reminder } from '../models/Reminder';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';

/**
 * Database Setup Script for Search Optimization
 * Creates text indexes for better search performance
 */
export class DatabaseSetup {
  
  static async createSearchIndexes(): Promise<void> {
    try {
      console.log('Creating search indexes...');

      // Create text index for Plants
      await Plant.collection.createIndex({
        name: 'text',
        species: 'text',
        commonName: 'text',
        category: 'text',
        location: 'text',
        notes: 'text'
      }, {
        name: 'plant_text_index',
        weights: {
          name: 10,
          species: 8,
          commonName: 6,
          category: 4,
          location: 2,
          notes: 1
        }
      });
      console.log('✅ Plant text index created');

      // Create additional indexes for Plants
      await Plant.collection.createIndex({ userId: 1, category: 1 });
      await Plant.collection.createIndex({ userId: 1, healthStatus: 1 });
      await Plant.collection.createIndex({ userId: 1, location: 1 });
      await Plant.collection.createIndex({ userId: 1, createdAt: -1 });
      console.log('✅ Plant additional indexes created');

      // Create text index for CareLog
      await CareLog.collection.createIndex({
        notes: 'text',
        careType: 'text',
        recommendations: 'text'
      }, {
        name: 'carelog_text_index',
        weights: {
          careType: 10,
          notes: 5,
          recommendations: 3
        }
      });
      console.log('✅ CareLog text index created');

      // Create additional indexes for CareLog
      await CareLog.collection.createIndex({ userId: 1, careType: 1 });
      await CareLog.collection.createIndex({ userId: 1, date: -1 });
      await CareLog.collection.createIndex({ userId: 1, plantId: 1, date: -1 });
      console.log('✅ CareLog additional indexes created');

      // Create text index for Reminder
      await Reminder.collection.createIndex({
        title: 'text',
        description: 'text',
        careType: 'text'
      }, {
        name: 'reminder_text_index',
        weights: {
          title: 10,
          careType: 8,
          description: 5
        }
      });
      console.log('✅ Reminder text index created');

      // Create additional indexes for Reminder
      await Reminder.collection.createIndex({ userId: 1, status: 1 });
      await Reminder.collection.createIndex({ userId: 1, careType: 1 });
      await Reminder.collection.createIndex({ userId: 1, nextDueDate: 1 });
      await Reminder.collection.createIndex({ userId: 1, plantId: 1 });
      console.log('✅ Reminder additional indexes created');

      // Create text index for Post
      await Post.collection.createIndex({
        title: 'text',
        content: 'text',
        tags: 'text'
      }, {
        name: 'post_text_index',
        weights: {
          title: 10,
          content: 5,
          tags: 8
        }
      });
      console.log('✅ Post text index created');

      // Create additional indexes for Post
      await Post.collection.createIndex({ category: 1, createdAt: -1 });
      await Post.collection.createIndex({ tags: 1, createdAt: -1 });
      await Post.collection.createIndex({ authorId: 1, createdAt: -1 });
      await Post.collection.createIndex({ plantId: 1, createdAt: -1 });
      console.log('✅ Post additional indexes created');

      // Create text index for Comment
      await Comment.collection.createIndex({
        content: 'text'
      }, {
        name: 'comment_text_index',
        weights: {
          content: 5
        }
      });
      console.log('✅ Comment text index created');

      // Create additional indexes for Comment
      await Comment.collection.createIndex({ postId: 1, createdAt: -1 });
      await Comment.collection.createIndex({ authorId: 1, createdAt: -1 });
      console.log('✅ Comment additional indexes created');

      console.log('🎉 All search indexes created successfully!');

    } catch (error) {
      console.error('❌ Error creating search indexes:', error);
      throw error;
    }
  }

  static async dropSearchIndexes(): Promise<void> {
    try {
      console.log('Dropping search indexes...');

      // Drop text indexes
      await Plant.collection.dropIndex('plant_text_index').catch(() => {});
      await CareLog.collection.dropIndex('carelog_text_index').catch(() => {});
      await Reminder.collection.dropIndex('reminder_text_index').catch(() => {});
      await Post.collection.dropIndex('post_text_index').catch(() => {});
      await Comment.collection.dropIndex('comment_text_index').catch(() => {});

      console.log('🗑️ Search indexes dropped successfully!');

    } catch (error) {
      console.error('❌ Error dropping search indexes:', error);
      throw error;
    }
  }

  static async optimizeDatabase(): Promise<void> {
    try {
      console.log('Optimizing database for search performance...');

      // Create search indexes
      await this.createSearchIndexes();

      // Create compound indexes for common query patterns
      await Plant.collection.createIndex({ userId: 1, category: 1, healthStatus: 1 });
      await CareLog.collection.createIndex({ userId: 1, plantId: 1, careType: 1 });
      await Reminder.collection.createIndex({ userId: 1, plantId: 1, status: 1 });
      await Post.collection.createIndex({ category: 1, tags: 1, createdAt: -1 });

      console.log('🚀 Database optimization completed!');

    } catch (error) {
      console.error('❌ Error optimizing database:', error);
      throw error;
    }
  }

  static async getIndexInfo(): Promise<any> {
    try {
      const indexInfo = {
        plants: await Plant.collection.listIndexes().toArray(),
        careLogs: await CareLog.collection.listIndexes().toArray(),
        reminders: await Reminder.collection.listIndexes().toArray(),
        posts: await Post.collection.listIndexes().toArray(),
        comments: await Comment.collection.listIndexes().toArray()
      };

      return indexInfo;
    } catch (error) {
      console.error('❌ Error getting index info:', error);
      throw error;
    }
  }
}

// Export for use in other files
export default DatabaseSetup;