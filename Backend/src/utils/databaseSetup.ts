import mongoose from 'mongoose';
import { Plant } from '../models/Plant';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';

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

      // Create text index for CommunityPost
      await CommunityPost.collection.createIndex({
        title: 'text',
        body: 'text',
        tags: 'text'
      }, {
        name: 'community_post_text_index',
        weights: {
          title: 10,
          body: 5,
          tags: 8
        }
      });
      console.log('✅ CommunityPost text index created');

      // Create additional indexes for Post
  await CommunityPost.collection.createIndex({ category: 1, createdAt: -1 });
  await CommunityPost.collection.createIndex({ tags: 1, createdAt: -1 });
  await CommunityPost.collection.createIndex({ authorId: 1, createdAt: -1 });
  await CommunityPost.collection.createIndex({ plantId: 1, createdAt: -1 });
  console.log('✅ CommunityPost additional indexes created');

      // Create text index for Comment
      await CommunityComment.collection.createIndex({
        text: 'text'
      }, {
        name: 'community_comment_text_index',
        weights: {
          text: 5
        }
      });
      console.log('✅ CommunityComment text index created');

      // Create additional indexes for Comment
  await CommunityComment.collection.createIndex({ postId: 1, createdAt: -1 });
  await CommunityComment.collection.createIndex({ authorId: 1, createdAt: -1 });
  console.log('✅ CommunityComment additional indexes created');

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
  await CommunityPost.collection.dropIndex('community_post_text_index').catch(() => {});
  await CommunityComment.collection.dropIndex('community_comment_text_index').catch(() => {});

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
  await CommunityPost.collection.createIndex({ category: 1, tags: 1, createdAt: -1 });

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
        posts: await CommunityPost.collection.listIndexes().toArray(),
        comments: await CommunityComment.collection.listIndexes().toArray()
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