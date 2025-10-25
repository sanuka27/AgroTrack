/**
 * Recalculate Post Vote Scores
 * 
 * This script recalculates the vote scores for all community posts
 * based on actual CommunityVote records in the database.
 * 
 * Run: npx ts-node scripts/recalculate-vote-scores.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
import '../src/models/CommunityPost';
import '../src/models/CommunityVote';

const CommunityPost = mongoose.model('CommunityPost');
const CommunityVote = mongoose.model('CommunityVote');

async function recalculateVoteScores() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all posts
    const posts = await CommunityPost.find({});
    console.log(`📊 Found ${posts.length} posts to recalculate`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const post of posts) {
      // Calculate actual score from votes
      const votes = await CommunityVote.find({ postId: post._id });
      const actualScore = votes.reduce((sum, vote) => sum + vote.value, 0);

      if (post.score !== actualScore) {
        console.log(`🔄 Post ${post._id}: ${post.score} → ${actualScore} (${votes.length} votes)`);
        post.score = actualScore;
        await post.save({ validateBeforeSave: false });
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    console.log('\n✅ Recalculation complete!');
    console.log(`   Updated: ${updatedCount} posts`);
    console.log(`   Unchanged: ${unchangedCount} posts`);

  } catch (error) {
    console.error('❌ Error recalculating vote scores:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the script
recalculateVoteScores()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
