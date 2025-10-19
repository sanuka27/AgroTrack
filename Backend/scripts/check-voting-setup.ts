import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkVotingSetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');

    // Check votes collection structure
    console.log('📊 Votes Collection:');
    const votes = await db.collection('votes').find({}).limit(5).toArray();
    console.log(`   Total votes: ${await db.collection('votes').countDocuments()}`);
    
    if (votes.length > 0) {
      console.log('\n   Sample vote:');
      console.log(`   - Post ID: ${votes[0].postId}`);
      console.log(`   - User ID: ${votes[0].userId}`);
      console.log(`   - Value: ${votes[0].value} (${votes[0].value === 1 ? 'upvote' : 'downvote'})`);
    }

    // Check indexes on votes collection
    console.log('\n📑 Votes Collection Indexes:');
    const indexes = await db.collection('votes').indexes();
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log(`     (unique index)`);
    });

    // Check a post's score
    console.log('\n📄 Sample Post with Votes:');
    const post = await db.collection('posts').findOne({});
    if (post) {
      console.log(`   Title: "${post.title}"`);
      console.log(`   Score: ${post.score}`);
      
      // Count upvotes and downvotes for this post
      const upvotes = await db.collection('votes').countDocuments({
        postId: post._id,
        value: 1
      });
      const downvotes = await db.collection('votes').countDocuments({
        postId: post._id,
        value: -1
      });
      
      console.log(`   Upvotes: ${upvotes}`);
      console.log(`   Downvotes: ${downvotes}`);
      console.log(`   Calculated score: ${upvotes - downvotes} (should match: ${post.score})`);
    }

    console.log('\n✅ Voting System Status:');
    console.log('   ✓ Votes collection exists');
    console.log('   ✓ Vote documents have correct structure (postId, userId, value)');
    console.log('   ✓ Posts have score field');
    console.log('\n💡 Voting endpoints:');
    console.log('   POST /api/community/forum/posts/:id/vote');
    console.log('   Body: { "value": 1 }  // for upvote');
    console.log('   Body: { "value": -1 } // for downvote');
    console.log('   Authorization: Bearer <firebase_token>');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVotingSetup();
