import { Request, Response } from 'express';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';
import { CommunityVote } from '../models/CommunityVote';
import { User } from '../models/User'; // Changed from CommunityUser
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
      // Use authenticated user from middleware
      const currentUser = req.user as any;
      if (!currentUser) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      // Validate input
      if (!title || !bodyMarkdown) {
        return res.status(400).json({
          success: false,
          message: 'Title and body are required',
        });
      }

      // Resolve the full user document from the authenticated user
      let user = null as any;
      if (currentUser._id) {
        user = await User.findById(currentUser._id).lean();
      }
      if (!user && currentUser.uid) {
        user = await User.findOne({ firebaseUid: currentUser.uid }).lean();
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Predefined display names
      const displayNames = [
        { name: 'Sanuka Marasinghe', role: 'admin' },
        { name: 'Asma Fahim', role: 'user' },
        { name: 'Pathumi Arunodya', role: 'admin' }
      ];

      // Determine author display name
      let authorDisplayName = user.name;
      const matchedName = displayNames.find(dn => dn.name === user.name);
      
      if (!matchedName) {
        // If user name doesn't match predefined names, use a predefined name based on role
        const filteredNames = user.role === 'admin' 
          ? displayNames.filter(dn => dn.role === 'admin')
          : displayNames;
        authorDisplayName = filteredNames[Math.floor(Math.random() * filteredNames.length)].name;
      }

      // Create post with author name stored
      const post = new CommunityPost({
        authorId: user._id,
        authorName: authorDisplayName,
        title,
        body: bodyMarkdown,
        images: images || [],
        score: 0,
        commentsCount: 0,
        isSolved: false,
        status: 'visible',
      });

      await post.save();

  logger.info(`Forum post created: ${post._id} by ${authorDisplayName} (user ${user._id})`);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: {
          post,
          author: {
            uid: user.firebaseUid,
            name: authorDisplayName,
            avatarUrl: user.avatar,
            role: user.role,
          },
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

      // For guests, limit to 3 posts (teaser)
      const queryLimit = showTeaser ? 3 : limitNum;

      // Build query
      const query: any = { status: 'visible' };

      if (tag) {
        query.tags = tag as string;
      }

      console.log('🔍 GET POSTS Query:', JSON.stringify(query));
      console.log('🔍 Sort:', sort, 'Limit:', queryLimit);

      // Cursor-based pagination
      if (cursor) {
        if (sort === 'top') {
          const cursorPost = await CommunityPost.findById(cursor);
          if (cursorPost) {
            query.$or = [
              { score: { $lt: cursorPost.score } },
              {
                score: cursorPost.score,
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
          ? { score: -1, createdAt: -1 }
          : { createdAt: -1 };

      const posts = await CommunityPost.find(query)
        .sort(sortOption)
        .limit(queryLimit + 1) // Fetch one extra to check for next page
        .lean();

      console.log('🔍 Posts found:', posts.length);

      // Check if there are more posts
      const hasMore = posts.length > queryLimit;
      if (hasMore) {
        posts.pop(); // Remove the extra post
      }

      // Get author information for all posts
      const authorIds = [...new Set(posts.map((p) => p.authorId?.toString()).filter(Boolean))];
      console.log('🔍 Author IDs to lookup:', authorIds.length, 'unique IDs');
      const authors = await User.find({ _id: { $in: authorIds } }).lean();
      console.log('🔍 Authors found:', authors.length);
      const authorsMap = new Map(authors.map((a) => [a._id.toString(), a]));

      // Get user votes if authenticated
      let userVotesMap = new Map();
      if (req.user) {
        // Find current user by firebaseUid
        const currentUser = await User.findOne({ firebaseUid: req.user.uid }).lean();
        if (currentUser) {
          const postIds = posts.map((p) => p._id);
          const userVotes = await CommunityVote.find({
            postId: { $in: postIds },
            userId: currentUser._id,
          }).lean();
          userVotesMap = new Map(userVotes.map((v) => [v.postId.toString(), v.value]));
        }
      }

      // Enrich posts with author info
      const enrichedPosts = posts.map((post) => {
        const author = authorsMap.get(post.authorId?.toString());
        
        // Use stored authorName from post if available, otherwise fallback to user lookup
        const displayName = (post as any).authorName || author?.name || 'Unknown User';
        
        return {
          ...post,
          // Ensure frontend has consistent field name for score
          voteScore: (post as any).score ?? 0,
          author: {
            uid: author?.firebaseUid || '',
            name: displayName,
            avatarUrl: author?.avatar || '',
            role: author?.role || 'user',
          },
          // Truncate body for guests
          bodyMarkdown: showTeaser
            ? post.body.substring(0, 200) +
              (post.body.length > 200 ? '...' : '')
            : post.body,
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

      console.log(`🔎 [GET POST] Requested id: ${id}`);
      console.log(`🔎 [GET POST] req.user present: ${!!req.user}`);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID',
        });
      }

      const post = await CommunityPost.findOne({
        _id: id,
        status: 'visible',
      }).lean();

      console.log(`🔎 [GET POST] DB lookup completed. post found: ${!!post}`);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Get author info
      const author = await User.findById(post.authorId).lean();

      // Use stored authorName from post if available
      const displayName = (post as any).authorName || author?.name || 'Unknown User';

      // Get user's vote if authenticated
      let userVote = null;
      if (req.user) {
        // Find user by firebaseUid to get ObjectId
        const currentUser = await User.findOne({ firebaseUid: req.user.uid }).lean();
        if (currentUser) {
          const vote = await CommunityVote.findOne({
            postId: id,
            userId: currentUser._id,
          }).lean();
          userVote = vote ? vote.value : null;
        }
      }

      res.json({
        success: true,
        data: {
          post: {
            ...post,
            // Provide consistent voteScore field expected by frontend
            voteScore: (post as any).score ?? 0,
            author: {
              _id: author?._id || post.authorId,
              uid: author?.firebaseUid || '',
              name: displayName,
              avatarUrl: author?.avatar || '',
              role: author?.role || 'user',
            },
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
      
      // req.user is populated by authMiddleware with the full User document
      const currentUser = req.user as any;

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

      // User is already loaded by authMiddleware
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      console.log(`🗳️ [VOTE] User ${currentUser._id} attempting to vote ${value} on post ${id}`);

      // Check if post exists
      const post = await CommunityPost.findOne({
        _id: id,
        status: 'visible',
      });

      if (!post) {
        console.log(`❌ [VOTE] Post not found: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      console.log(`✅ [VOTE] Post found: ${post._id}, current score: ${post.score}`);

      // Check if user already voted
      const existingVote = await CommunityVote.findOne({
        postId: id,
        userId: currentUser._id,
      });

      console.log(`🗳️ [VOTE] Existing vote:`, existingVote ? `value=${existingVote.value}` : 'none');

      let voteScoreDelta = 0;
      const oldScore = post.score;

      if (existingVote) {
        // If same vote, remove it (toggle)
        if (existingVote.value === value) {
          await CommunityVote.deleteOne({ _id: existingVote._id });
          voteScoreDelta = -value; // Remove the vote
          console.log(`🗳️ [VOTE] Toggle OFF - Removing vote ${value}, delta: ${voteScoreDelta}`);
        } else {
          // Change vote
          existingVote.value = value;
          await existingVote.save();
          voteScoreDelta = value * 2; // e.g., -1 to 1 = +2
          console.log(`🗳️ [VOTE] Vote CHANGED from ${existingVote.value === 1 ? -1 : 1} to ${value}, delta: ${voteScoreDelta}`);
        }
      } else {
        // Create new vote
        await CommunityVote.create({
          postId: id,
          userId: currentUser._id,
          value,
        });
        voteScoreDelta = value;
        console.log(`🗳️ [VOTE] NEW vote created: value=${value}, delta: ${voteScoreDelta}`);
      }

      // Update post vote score
      post.score += voteScoreDelta;
      console.log(`🗳️ [VOTE] Score calculation: ${oldScore} + ${voteScoreDelta} = ${post.score}`);
      await post.save({ validateBeforeSave: false }); // Skip validation for embedded comments

      // Get updated user vote
      const updatedVote = await CommunityVote.findOne({
        postId: id,
        userId: currentUser._id,
      });

      console.log(`✅ [VOTE] Success! New score: ${post.score}, userVote: ${updatedVote?.value || null}`);

      res.json({
        success: true,
        data: {
          voteScore: post.score,
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

      console.log(`📝 [COMMENT] Request to create comment on post ${id}`);
      console.log(`📝 [COMMENT] bodyMarkdown length: ${typeof bodyMarkdown === 'string' ? bodyMarkdown.length : 'n/a'}`);
      console.log(`📝 [COMMENT] req.user present: ${!!req.user}`);

      // Validate input
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

      // Ensure authenticated user is present
      const currentUser = req.user as any;
      if (!currentUser) {
        console.log('❌ [COMMENT] No authenticated user on req');
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Check if post exists and is visible
      const post = await CommunityPost.findOne({ _id: id, status: 'visible' });
      console.log(`📝 [COMMENT] Post lookup result: ${!!post}`);

      if (!post) {
        console.log(`❌ [COMMENT] Post not found for id ${id}`);
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Create comment using authenticated user's ObjectId
      const comment = new CommunityComment({
        postId: id,
        authorId: currentUser._id,
        text: bodyMarkdown,
        status: 'visible',
      });

      await comment.save();

      // Increment comment count
      post.commentsCount = (post.commentsCount || 0) + 1;
      await post.save({ validateBeforeSave: false });

      logger.info(`Comment created: ${comment._id} on post ${id} by ${currentUser._id}`);

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: {
          // Return comment shaped for frontend compatibility (bodyMarkdown, author.uid)
          comment: {
            ...comment.toObject(),
            bodyMarkdown: (comment as any).text || (comment as any).body || '',
            author: {
              uid: currentUser.firebaseUid || '',
              name: currentUser.name || 'Unknown',
              avatarUrl: currentUser.avatar || '',
              role: currentUser.role || 'user',
            },
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
        status: 'visible',
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

      // Get author information for all comments
      const authorIds = [...new Set(comments.map((c) => c.authorId?.toString()).filter(Boolean))];
      const authors = await User.find({ _id: { $in: authorIds } }).lean();
      const authorsMap = new Map(authors.map((a) => [a._id.toString(), a]));

      // Enrich comments with author info
      const enrichedComments = comments.map((comment) => {
        const author = authorsMap.get(comment.authorId?.toString());
        // Normalize comment shape to match frontend types (bodyMarkdown + author.uid)
        return {
          ...comment,
          bodyMarkdown: (comment as any).text || (comment as any).body || '',
          author: author
            ? {
                uid: author.firebaseUid,
                name: author.name,
                avatarUrl: author.avatar,
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
   * Toggle solved status on a post (by OP or admin)
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
        status: 'visible',
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      // Check if user is OP or admin
      const user = await User.findOne({ uid: userUid });
      const isAdmin = user && user.role === 'admin';
      // Get user ObjectId from firebaseUid
      const currentUser = await User.findOne({ firebaseUid: userUid }).lean();
      const isOP = currentUser && post.authorId?.toString() === currentUser._id.toString();

      if (!isOP && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the post author or admins can mark as solved',
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
            status: 'visible',
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

      let user = await User.findOne({ uid: userUid });

      if (!user) {
        // Create new user
        user = await User.create({
          uid: userUid,
          name: name || 'Anonymous',
          avatarUrl,
          role: 'user',
        });
        logger.info(`Community user created: ${userUid}`);
      } else if (name || avatarUrl) {
        // Update existing user
        if (name) user.name = name;
        if (avatarUrl) user.avatar = avatarUrl;
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
