/**
 * Script to update existing posts with author names
 * Adds authorName field to all existing posts
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { CommunityPost } from '../src/models/CommunityPost';
import { CommunityUser } from '../src/models/CommunityUser';
import { connectDatabase } from '../src/config/database';

// Load environment variables
dotenv.config();

// Predefined display names
const displayNames = [
  { name: 'Sanuka Marasinghe', role: 'admin' },
  { name: 'Asma Fahim', role: 'user' },
  { name: 'Pathumi Arunodya', role: 'admin' }
];

async function updatePostAuthors() {
  try {
    console.log('🔄 Starting post author name update...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Get all posts
    const posts = await CommunityPost.find({});
    console.log(`📊 Found ${posts.length} posts to update\n`);

    let updatedCount = 0;
    const nameDistribution: Record<string, number> = {};

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      
      // Force update all posts to redistribute names evenly
      // Remove the skip logic to update existing authorNames

      // Get author information
      const author = await CommunityUser.findById(post.authorId);
      
      if (!author) {
        console.log(`⚠️  Post ${post._id}: Author not found, using default name`);
        // Use a default name - distribute evenly
        const nameIndex = i % displayNames.length;
        const defaultName = displayNames[nameIndex].name;
        await CommunityPost.updateOne(
          { _id: post._id },
          { 
            $set: { 
              authorName: defaultName
            } 
          }
        );
        nameDistribution[defaultName] = (nameDistribution[defaultName] || 0) + 1;
        updatedCount++;
        console.log(`✅ Post ${post._id} updated with default name: ${defaultName}`);
        continue;
      }

      // Force round-robin distribution regardless of actual author
      // This ensures posts are evenly distributed among all three names
      const nameIndex = i % displayNames.length;
      const displayName = displayNames[nameIndex].name;

      // Update post with author name
      await CommunityPost.updateOne(
        { _id: post._id },
        { 
          $set: { 
            authorName: displayName
          } 
        }
      );

      nameDistribution[displayName] = (nameDistribution[displayName] || 0) + 1;
      updatedCount++;
      console.log(`✅ Post ${post._id} updated with author: ${displayName}`);
    }

    console.log('\n=====================================');
    console.log('📊 Update Summary:');
    console.log(`   Total posts: ${posts.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log('\n📊 Name Distribution:');
    Object.entries(nameDistribution).forEach(([name, count]) => {
      console.log(`   ${name}: ${count} posts`);
    });
    console.log('=====================================\n');

    // Verify updates
    console.log('🔍 Verifying updates...');
    const postsWithAuthorName = await CommunityPost.countDocuments({ 
      authorName: { $exists: true, $ne: '' } 
    });
    console.log(`✅ Posts with authorName: ${postsWithAuthorName}/${posts.length}`);

    // Show sample posts
    console.log('\n📝 Sample posts with author names:');
    const samples = await CommunityPost.find({ authorName: { $exists: true } })
      .limit(5)
      .select('title authorName authorUsername createdAt');
    
    samples.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}"`);
      console.log(`      Author: ${(post as any).authorName}`);
      console.log(`      Created: ${post.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error updating post authors:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

updatePostAuthors();
