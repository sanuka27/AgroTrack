import { MigrationRunner, BatchResult } from '../runner';
import { mapCommunityPost } from '../config/mapping';
import { Post } from '../../../src/models/new/posts';

export async function postsStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  return runner.runStep(
    'postsStep',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      // Get all post IDs in this batch
      const postIds = batch.map(post => post._id);

      // Fetch comments and votes for these posts in parallel
      const [comments, votes] = await Promise.all([
        runner['db'].collection('communitycomments').find({ postId: { $in: postIds } }).toArray(),
        runner['db'].collection('communityvotes').find({ postId: { $in: postIds } }).toArray()
      ]);

      // Group comments and votes by postId
      const commentsByPost = new Map();
      const votesByPost = new Map();

      comments.forEach((comment: any) => {
        const postId = comment.postId.toString();
        if (!commentsByPost.has(postId)) commentsByPost.set(postId, []);
        commentsByPost.get(postId).push(comment);
      });

      votes.forEach((vote: any) => {
        const postId = vote.postId.toString();
        if (!votesByPost.has(postId)) votesByPost.set(postId, []);
        votesByPost.get(postId).push(vote);
      });

      // Process each post
      for (const post of batch) {
        try {
          const postComments = commentsByPost.get(post._id.toString()) || [];
          const postVotes = votesByPost.get(post._id.toString()) || [];

          const mappedPost = await mapCommunityPost(post, postComments, postVotes);

          if (!isDryRun) {
            // Insert the post
            await Post.create(mappedPost);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process post ${post._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'communityposts',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );
}

export default postsStep;