import { Request, Response } from 'express';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';
import { CommunityVote } from '../models/CommunityVote';
import { CommunityUser } from '../models/CommunityUser';
import { CommunityReport } from '../models/CommunityReport';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

// Extended Request with user info
interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export class CommunityForumController {
  /**
   * Create a new post
   * POST /api/community/forum/posts
   */
  static async createPost(req: AuthRequest, res: Response) {
    try {
      const { title, bodyMarkdown, images } = req.body;
      const authorUid = req.user!.uid;

      // Validate input
      if (!title || !bodyMarkdown) {
        return res.status(400).json({
          success: false,
          message: 'Title and body are required',
        });
      }

      // Create post
      const post = new CommunityPost({
        authorUid,
        title,
        bodyMarkdown,
        images: images || [],
        voteScore: 0,
        commentCount: 0,
        isSolved: false,
        isDeleted: false,
      });

      await post.save();

      // Populate author info
      const author = await CommunityUser.findOne({ uid: authorUid });

      logger.info(`Forum post created: ${post._id} by ${authorUid}`);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: {
          post,
          author: author ? {
            uid: author.uid,
            name: author.name,
            avatarUrl: author.avatarUrl,
            role: author.role,
          } : null,
        },
      });
    } catch (error: any) {
      logger.error('Error creating forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get posts with pagination and filtering
   * GET /api/community/forum/posts?sort=top|latest&tag=tomatoes&cursor=&limit=10
   */
  static async getPosts(req: AuthRequest, res: Response) {
    try {
      const {
        sort = 'latest',
        tag,
        cursor,
        limit = '10',
        includeTeaser = 'false',
      } = req.query;

      const limitNum = Math.min(parseInt(limit as string) || 10, 50);
      const isGuest = !req.user;
      const showTeaser = includeTeaser === 'true' && isGuest;

      // Build query
      const query: any = { isDeleted: false };

      if (tag) {
        query.tags = tag as string;
      }

      // Cursor-based pagination
      if (cursor) {
        if (sort === 'top') {
          const cursorPost = await CommunityPost.findById(cursor);
          if (cursorPost) {
            query.$or = [
              { voteScore: { $lt: cursorPost.voteScore } },
              {
                voteScore: cursorPost.voteScore,
                _id: { $lt: new mongoose.Types.ObjectId(cursor as string) },
              },
            ];
          }
        } else {
          query._id = { $lt: new mongoose.Types.ObjectId(cursor as string) };
        }
      }

      // Sorting
      const sortOption: any =
        sort === 'top'
          ? { voteScore: -1, createdAt: -1 }
          : { createdAt: -1 };

      // For guests, limit to 3 posts (teaser)
      const queryLimit = showTeaser ? 3 : limitNum;

      const posts = await CommunityPost.find(query)
        .sort(sortOption)
        .limit(queryLimit + 1) // Fetch one extra to check for next page
        .lean();

      // Check if there are more posts
      const hasMore = posts.length > queryLimit;
      if (hasMore) {
        posts.pop(); // Remove the extra post
      }

      // Get author information for all posts
      const authorUids = [...new Set(posts.map((p) => p.authorUid))];
      const authors = await CommunityUser.find({ uid: { $in: authorUids } }).lean();
      const authorsMap = new Map(authors.map((a) => [a.uid, a]));

      // Get user votes if authenticated
      let userVotesMap = new Map();
      if (req.user) {
        const postIds = posts.map((p) => p._id);
        const userVotes = await CommunityVote.find({
          postId: { $in: postIds },
          voterUid: req.user.uid,
        }).lean();
        userVotesMap = new Map(userVotes.map((v) => [v.postId.toString(), v.value]));
      }

      // Enrich posts with author info
      const enrichedPosts = posts.map((post) => {
        const author = authorsMap.get(post.authorUid);
        return {
          ...post,
          author: author
            ? {
                uid: author.uid,
                name: author.name,
                avatarUrl: author.avatarUrl,
                role: author.role,
              }
            : null,
          // Truncate body for guests
          bodyMarkdown: showTeaser
            ? post.bodyMarkdown.substring(0, 200) +
              (post.bodyMarkdown.length > 200 ? '...' : '')
            : post.bodyMarkdown,
          userVote: userVotesMap.get(post._id.toString()) || null,
        };
      });

      // Get next cursor
      const nextCursor = hasMore
        ? posts[posts.length - 1]._id.toString()
        : null;

      res.json({
        success: true,
        data: {
          posts: enrichedPosts,
          hasMore,
          nextCursor,
          isGuest,
          isTeaser: showTeaser,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching forum posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get a single post by ID
   * GET /api/community/forum/posts/:id
   */
  static async getPostById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID',
        });
      }

      const post = await CommunityPost.findOne({
        _id: id,
        isDeleted: false,
      }).lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Get author info
      const author = await CommunityUser.findOne({ uid: post.authorUid }).lean();

      // Get user's vote if authenticated
      let userVote = null;
      if (req.user) {
        const vote = await CommunityVote.findOne({
          postId: id,
          voterUid: req.user.uid,
        }).lean();
        userVote = vote ? vote.value : null;
      }

      res.json({
        success: true,
        data: {
          post: {
            ...post,
            author: author
              ? {
                  uid: author.uid,
                  name: author.name,
                  avatarUrl: author.avatarUrl,
                  role: author.role,
                }
              : null,
          },
          userVote,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Vote on a post (upvote or downvote)
   * POST /api/community/forum/posts/:id/vote
   * Body: { value: 1 | -1 }
   */
  static async votePost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { value } = req.body;
      const voterUid = req.user!.uid;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID',
        });
      }

      if (value !== 1 && value !== -1) {
        return res.status(400).json({
          success: false,
          message: 'Vote value must be 1 (upvote) or -1 (downvote)',
        });
      }

      // Check if post exists
      const post = await CommunityPost.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Check if user already voted
      const existingVote = await CommunityVote.findOne({
        postId: id,
        voterUid,
      });

      let voteScoreDelta = 0;

      if (existingVote) {
        // If same vote, remove it (toggle)
        if (existingVote.value === value) {
          await CommunityVote.deleteOne({ _id: existingVote._id });
          voteScoreDelta = -value; // Remove the vote
          logger.info(`Vote removed: post ${id} by ${voterUid}`);
        } else {
          // Change vote
          existingVote.value = value;
          await existingVote.save();
          voteScoreDelta = value * 2; // e.g., -1 to 1 = +2
          logger.info(`Vote changed: post ${id} by ${voterUid} to ${value}`);
        }
      } else {
        // Create new vote
        await CommunityVote.create({
          postId: id,
          voterUid,
          value,
        });
        voteScoreDelta = value;
        logger.info(`Vote created: post ${id} by ${voterUid} value ${value}`);
      }

      // Update post vote score
      post.voteScore += voteScoreDelta;
      await post.save();

      // Get updated user vote
      const updatedVote = await CommunityVote.findOne({
        postId: id,
        voterUid,
      });

      res.json({
        success: true,
        data: {
          voteScore: post.voteScore,
          userVote: updatedVote ? updatedVote.value : null,
        },
      });
    } catch (error: any) {
      logger.error('Error voting on forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to vote on post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create a comment on a post
   * POST /api/community/forum/posts/:id/comments
   */
  static async createComment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { bodyMarkdown } = req.body;
      const authorUid = req.user!.uid;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID',
        });
      }

      if (!bodyMarkdown) {
        return res.status(400).json({
          success: false,
          message: 'Comment body is required',
        });
      }

      // Check if post exists
      const post = await CommunityPost.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Create comment
      const comment = await CommunityComment.create({
        postId: id,
        authorUid,
        bodyMarkdown,
        isDeleted: false,
      });

      // Increment comment count
      post.commentCount += 1;
      await post.save();

      // Get author info
      const author = await CommunityUser.findOne({ uid: authorUid }).lean();

      logger.info(`Comment created: ${comment._id} on post ${id} by ${authorUid}`);

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: {
          comment: {
            ...comment.toObject(),
            author: author
              ? {
                  uid: author.uid,
                  name: author.name,
                  avatarUrl: author.avatarUrl,
                  role: author.role,
                }
              : null,
          },
        },
      });
    } catch (error: any) {
      logger.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get comments for a post
   * GET /api/community/forum/posts/:id/comments
   */
  static async getComments(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { cursor, limit = '20' } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID',
        });
      }

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);

      // Build query
      const query: any = {
        postId: id,
        isDeleted: false,
      };

      if (cursor) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor as string) };
      }

      const comments = await CommunityComment.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum + 1)
        .lean();

      // Check if there are more comments
      const hasMore = comments.length > limitNum;
      if (hasMore) {
        comments.pop();
      }

      // Get author information
      const authorUids = [...new Set(comments.map((c) => c.authorUid))];
      const authors = await CommunityUser.find({ uid: { $in: authorUids } }).lean();
      const authorsMap = new Map(authors.map((a) => [a.uid, a]));

      // Enrich comments with author info
      const enrichedComments = comments.map((comment) => {
        const author = authorsMap.get(comment.authorUid);
        return {
          ...comment,
          author: author
            ? {
                uid: author.uid,
                name: author.name,
                avatarUrl: author.avatarUrl,
                role: author.role,
              }
            : null,
        };
      });

      const nextCursor = hasMore ? comments[comments.length - 1]._id.toString() : null;

      res.json({
        success: true,
        data: {
          comments: enrichedComments,
          hasMore,
          nextCursor,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Report a post or comment
   * POST /api/community/forum/reports
   */
  static async createReport(req: AuthRequest, res: Response) {
    try {
      const { targetType, targetId, reason, description } = req.body;
      const reporterUid = req.user!.uid;

      if (!targetType || !targetId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Target type, target ID, and reason are required',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target ID',
        });
      }

      // Create report
      const report = await CommunityReport.create({
        reporterUid,
        targetType,
        targetId,
        reason,
        description,
        status: 'pending',
      });

      logger.info(`Report created: ${report._id} by ${reporterUid} for ${targetType} ${targetId}`);

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: { report },
      });
    } catch (error: any) {
      logger.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Toggle solved status on a post (by OP or moderator)
   * PATCH /api/community/forum/posts/:id/solved
   */
  static async toggleSolved(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isSolved } = req.body;
      const userUid = req.user!.uid;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID',
        });
      }

      const post = await CommunityPost.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Check if user is OP or moderator
      const user = await CommunityUser.findOne({ uid: userUid });
      const isMod = user && (user.role === 'mod' || user.role === 'admin');
      const isOP = post.authorUid === userUid;

      if (!isOP && !isMod) {
        return res.status(403).json({
          success: false,
          message: 'Only the post author or moderators can mark as solved',
        });
      }

      post.isSolved = isSolved !== undefined ? isSolved : !post.isSolved;
      await post.save();

      logger.info(`Post ${id} solved status changed to ${post.isSolved} by ${userUid}`);

      res.json({
        success: true,
        data: { isSolved: post.isSolved },
      });
    } catch (error: any) {
      logger.error('Error toggling solved status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update solved status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get trending tags
   * GET /api/community/forum/tags/trending
   */
  static async getTrendingTags(req: AuthRequest, res: Response) {
    try {
      const { days = '7', limit = '10' } = req.query;
      const daysNum = parseInt(days as string) || 7;
      const limitNum = Math.min(parseInt(limit as string) || 10, 50);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Aggregate trending tags
      const trendingTags = await CommunityPost.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: { $gte: startDate },
          },
        },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
            totalVotes: { $sum: '$voteScore' },
          },
        },
        {
          $project: {
            tag: '$_id',
            count: 1,
            totalVotes: 1,
            score: { $add: ['$count', { $multiply: ['$totalVotes', 0.1] }] },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limitNum },
      ]);

      res.json({
        success: true,
        data: {
          tags: trendingTags.map((t) => ({
            tag: t.tag,
            count: t.count,
            totalVotes: t.totalVotes,
          })),
        },
      });
    } catch (error: any) {
      logger.error('Error fetching trending tags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trending tags',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get or create community user profile
   * POST /api/community/forum/users/profile
   */
  static async getOrCreateProfile(req: AuthRequest, res: Response) {
    try {
      const { uid, name, avatarUrl } = req.body;
      const userUid = req.user!.uid;

      // Ensure user is updating their own profile
      if (uid && uid !== userUid) {
        return res.status(403).json({
          success: false,
          message: 'Cannot update another user\'s profile',
        });
      }

      let user = await CommunityUser.findOne({ uid: userUid });

      if (!user) {
        // Create new user
        user = await CommunityUser.create({
          uid: userUid,
          name: name || 'Anonymous',
          avatarUrl,
          role: 'user',
        });
        logger.info(`Community user created: ${userUid}`);
      } else if (name || avatarUrl) {
        // Update existing user
        if (name) user.name = name;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        await user.save();
        logger.info(`Community user updated: ${userUid}`);
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      logger.error('Error getting/creating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get/create user profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Upload images for forum posts
   * POST /api/community/forum/upload
   */
  static async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const userUid = req.user!.uid;
      
      // The actual upload will be handled by Firebase Storage middleware
      // This endpoint just validates and returns the upload info
      
      res.json({
        success: true,
        message: 'Image upload endpoint ready',
        data: {
          message: 'Use Firebase Storage directly from client for community images',
          path: `community/${userUid}/{postId}/{uuid}.jpg`,
        },
      });
    } catch (error: any) {
      logger.error('Error in upload endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process upload',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}
