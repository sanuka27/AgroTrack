import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import '../src/models/CommunityPost';
import '../src/models/CommunityVote';
import '../src/models/CommunityComment';

const CommunityPost = mongoose.model('CommunityPost');
const CommunityVote = mongoose.model('CommunityVote');
const CommunityComment = mongoose.model('CommunityComment');

async function run() {
  const postId = process.argv[2];
  if (!postId) {
    console.error('Usage: npx ts-node scripts/check-post.ts <postId>');
    process.exit(2);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(2);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  try {
    const post: any = await CommunityPost.findById(postId).lean();
    console.log('Post found:', !!post);
    if (post && !Array.isArray(post)) {
      console.log('Post summary:');
      const id = post._id && post._id.toString ? post._id.toString() : post._id;
      console.log({ _id: id, title: post.title || '', status: post.status, score: post.score ?? post.voteScore });
    } else if (Array.isArray(post)) {
      console.log('Warning: found multiple posts (unexpected). Listing IDs:');
      console.log(post.map((p: any) => (p._id && p._id.toString ? p._id.toString() : p._id)));
    }

    const commentsCount = await CommunityComment.countDocuments({ postId });
    console.log('Comments count for post:', commentsCount);

    if (commentsCount > 0) {
      const sampleComments = await CommunityComment.find({ postId }).limit(5).lean();
      console.log('Sample comments:');
      sampleComments.forEach((c: any, idx: number) => {
        console.log(idx + 1, { _id: c._id.toString(), text: c.body || c.text || '', authorId: c.authorId?.toString?.() || c.authorId });
      });
    }

    const votesCount = await CommunityVote.countDocuments({ postId });
    const votesAgg = await CommunityVote.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      { $group: { _id: '$value', count: { $sum: 1 } } }
    ]);
    console.log('Votes count total:', votesCount, 'breakdown:', votesAgg);

  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
