import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';
import { User } from '../models/User';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';
import { logger } from '../config/logger';

export class CommunityController {
  
  // Forum Posts CRUD Operations
  
  /**
   * Create a new forum post
   */
  static async createPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        title,
        content,
        category,
        tags = [],
        postType = 'discussion',
        images = [],
        isAnonymous = false,
        allowComments = true,
        plantId,
        expertiseLevel
      } = req.body;

      // Create post
      const post = new CommunityPost({
        title,
        body: content,
        category,
        tags,
        postType,
        authorId: userId,
        images,
        isAnonymous,
        allowComments,
        plantId,
        expertiseLevel,
        status: 'visible',
        score: 0,
        commentsCount: 0,
      });

      await post.save();

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId },
        {
          $inc: {
            'community.postsCreated': 1,
            'engagement.totalActions': 1
          },
          $set: {
            'community.lastPostDate': new Date(),
            'community.expertiseLevel': expertiseLevel || 'beginner',
            lastActivityDate: new Date()
          }
        },
        { upsert: true }
      );

      // Populate response data
      const populatedPost = await CommunityPost.findById(post._id)
        .populate('authorId', 'username profilePicture bio expertiseLevel')
        .populate('plantId', 'name species images')
        .lean();

      logger.info(`New forum post created: ${post._id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Forum post created successfully',
        data: {
          post: populatedPost
        }
      });

    } catch (error) {
      logger.error('Error creating forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create forum post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get forum posts with filtering and pagination
   */
  static async getPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        postType,
        tags,
        expertiseLevel,
        author,
        plantId,
        search,
        status = 'active',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Build filter query
  const filter: any = { status: status === 'active' ? 'visible' : status };

      if (category) filter.category = category;
      if (postType) filter.postType = postType;
      if (expertiseLevel) filter.expertiseLevel = expertiseLevel;
  if (author) filter.authorId = author;
      if (plantId) filter.plantId = plantId;

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter.tags = { $in: tagArray };
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort: any = {};
      if (sortBy === 'popularity') {
        sort['engagement.likes'] = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'engagement') {
        sort['engagement.comments'] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Get posts with population
      const posts = await CommunityPost.find(filter)
        .populate('authorId', 'username profilePicture bio expertiseLevel')
        .populate('plantId', 'name species images')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Get total count for pagination
  const totalPosts = await CommunityPost.countDocuments(filter);
      const totalPages = Math.ceil(totalPosts / Number(limit));

      // Update view counts for posts
      const postIds = posts.map(post => post._id);
      await CommunityPost.updateMany(
        { _id: { $in: postIds } },
        { $inc: { score: 0 } }
      );

      res.status(200).json({
        success: true,
        message: 'Forum posts retrieved successfully',
        data: {
          posts,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalPosts,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting forum posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve forum posts',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get a single forum post by ID
   */
  static async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = (req.user as any)?._id ? new mongoose.Types.ObjectId((req.user as any)._id.toString()) : null;

      const post = await CommunityPost.findById(postId)
        .populate('authorId', 'username profilePicture bio expertiseLevel')
        .populate('plantId', 'name species images')
        .lean();

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
        return;
      }

      // Increment view count (only once per user session)
      // no-op for views in simplified model

      // Check if user has liked this post
      const hasLiked = false;

      res.status(200).json({
        success: true,
        message: 'Forum post retrieved successfully',
        data: {
          post: {
            ...post,
            hasLiked,
            // Include embedded comments in response
            comments: post.comments || []
          }
        }
      });

    } catch (error) {
      logger.error('Error getting forum post by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve forum post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Update a forum post
   */
  static async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const updateData = req.body;

      // Find the post
  const post = await CommunityPost.findById(postId);
      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
        return;
      }

      // Check ownership
  if (post.authorId.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to update this post'
        });
        return;
      }

      // Update allowed fields
      const allowedUpdates = [
        'title', 'content', 'category', 'tags', 'images', 
        'allowComments', 'expertiseLevel', 'plantId'
      ];

      const updates: any = {};
      for (const field of allowedUpdates) {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      }

      // Add edit metadata
      updates.editedAt = new Date();
      updates.editCount = (post.editCount || 0) + 1;

      const updatedPost = await CommunityPost.findByIdAndUpdate(
        postId,
        { $set: { ...updates, body: updates.content, content: undefined } },
        { new: true, runValidators: true }
      ).populate('authorId', 'username profilePicture bio expertiseLevel')
       .populate('plantId', 'name species images');

      logger.info(`Forum post updated: ${postId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Forum post updated successfully',
        data: {
          post: updatedPost
        }
      });

    } catch (error) {
      logger.error('Error updating forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update forum post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Delete a forum post
   */
  static async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const userRole = (req.user as any).role;

      // Find the post
  const post = await CommunityPost.findById(postId);
      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
        return;
      }

      // Check authorization (owner or admin/moderator)
  if (post.authorId.toString() !== userId.toString() && !['admin'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to delete this post'
        });
        return;
      }

      // Soft delete - update status instead of removing
      await CommunityPost.findByIdAndUpdate(postId, { status: 'deleted', deletedAt: new Date() });

      // Also delete associated likes and comments
      await CommunityComment.updateMany({ postId }, { status: 'deleted', deletedAt: new Date() });

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId: post.author },
        {
          $inc: {
            'community.postsCreated': -1,
            'engagement.totalActions': -1
          }
        }
      );

      logger.info(`Forum post deleted: ${postId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Forum post deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting forum post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete forum post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Comments Management
  
  /**
   * Add a comment to a post
   */
  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { content, parentCommentId, isAnonymous = false } = req.body;

      // Check if post exists and allows comments
  const post = await CommunityPost.findById(postId);
      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
        return;
      }

      if (!post.allowComments) {
        res.status(403).json({
          success: false,
          message: 'Comments are not allowed on this post'
        });
        return;
      }

      // Create comment
      const comment = new CommunityComment({
        text: content,
        authorId: userId,
        postId,
        parentCommentId,
        status: 'visible'
      });

      await comment.save();

      // Update post comment count
      await CommunityPost.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

      // Update parent comment reply count if this is a reply
      if (parentCommentId) {
        // replies count not tracked in simplified model
      }

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId },
        {
          $inc: {
            'community.commentsPosted': 1,
            'engagement.totalActions': 1
          },
          $set: {
            'community.lastCommentDate': new Date(),
            lastActivityDate: new Date()
          }
        },
        { upsert: true }
      );

      // Populate response data
      const populatedComment = await CommunityComment.findById(comment._id)
        .populate('authorId', 'username profilePicture bio expertiseLevel');

      logger.info(`New comment added: ${comment._id} on post ${postId} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: {
          comment: populatedComment
        }
      });

    } catch (error) {
      logger.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get comments for a post
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const {
        sortBy = 'createdAt',
        sortOrder = 'asc',
        page = 1,
        limit = 50
      } = req.query;

      // Check if post exists
  const post = await CommunityPost.findById(postId);
      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
        return;
      }

      // Build sort object
      const sort: any = {};
      if (sortBy === 'popularity') {
        sort['engagement.likes'] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Get top-level comments (no parent)
      const comments = await CommunityComment.find({
        postId,
        parentCommentId: null,
        status: 'visible'
      })
      .populate('authorId', 'username profilePicture bio expertiseLevel')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await CommunityComment.find({
            parentCommentId: comment._id,
            status: 'visible'
          })
          .populate('authorId', 'username profilePicture bio expertiseLevel')
          .sort({ createdAt: 1 })
          .limit(10) // Limit replies per comment
          .lean();

          return {
            ...comment,
            replies
          };
        })
      );

      // Get total count
      const totalComments = await CommunityComment.countDocuments({
        postId,
        parentCommentId: null,
        status: 'visible'
      });

      const totalPages = Math.ceil(totalComments / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: {
          comments: commentsWithReplies,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalComments,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve comments',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { content } = req.body;

      // Find the comment
  const comment = await CommunityComment.findById(commentId);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
        return;
      }

      // Check ownership
  if (comment.authorId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to update this comment'
        });
        return;
      }

      // Update comment
      const updatedComment = await CommunityComment.findByIdAndUpdate(
        commentId,
        { text: content, editedAt: new Date(), editCount: (comment.editCount || 0) + 1 },
        { new: true, runValidators: true }
      ).populate('authorId', 'username profilePicture bio expertiseLevel');

      logger.info(`Comment updated: ${commentId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: {
          comment: updatedComment
        }
      });

    } catch (error) {
      logger.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const userRole = (req.user as any).role;

      // Find the comment
  const comment = await CommunityComment.findById(commentId);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
        return;
      }

      // Check authorization
  if (comment.authorId?.toString() !== userId.toString() && !['admin'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment'
        });
        return;
      }

      // Soft delete
      await CommunityComment.findByIdAndUpdate(commentId, { status: 'deleted', deletedAt: new Date() });

      // Update post comment count
      await CommunityPost.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

      // Update parent comment reply count if this is a reply
      if (comment.parentCommentId) {
        // replies count not tracked in simplified model
      }

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId: comment.author },
        {
          $inc: {
            'community.commentsPosted': -1,
            'engagement.totalActions': -1
          }
        }
      );

      logger.info(`Comment deleted: ${commentId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Likes and Reactions

  /**
   * Toggle like on a post or comment
   */
  static async toggleLike(_req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Likes are not available in this deployment.' });
  }

  // Content Moderation

  /**
   * Flag a post or comment for moderation
   */
  static async flagContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { targetId, targetType, reason, description } = req.body;

      if (!['post', 'comment'].includes(targetType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid target type. Must be post or comment'
        });
        return;
      }

      // Check if target exists
      const Model = targetType === 'post' ? CommunityPost : CommunityComment;
      const target = await (Model as any).findById(targetId);
      if (!target) {
        res.status(404).json({
          success: false,
          message: `${targetType} not found`
        });
        return;
      }

      // Check if user already flagged this content
      const existingFlag = target.moderation?.flags?.find(
        (flag: any) => flag.reportedBy.toString() === userId
      );

      if (existingFlag) {
        res.status(400).json({
          success: false,
          message: 'You have already flagged this content'
        });
        return;
      }

      // Add flag to content
      const flagData = {
        reason,
        description,
        reportedBy: userId,
        reportedAt: new Date()
      };

      await (Model as any).findByIdAndUpdate(targetId, {
        $push: { 'moderation.flags': flagData },
        $inc: { 'moderation.flagCount': 1 },
        $set: { 'moderation.flagged': true }
      });

      logger.info(`Content flagged: ${targetType} ${targetId} by user ${userId} for ${reason}`);

      res.status(200).json({
        success: true,
        message: 'Content flagged for moderation successfully'
      });

    } catch (error) {
      logger.error('Error flagging content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to flag content',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Community Statistics

  /**
   * Get community statistics
   */
  static async getCommunityStats(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeframe = '30d', // 7d, 30d, 90d, 1y, all
        category
      } = req.query;

      // Calculate date range
      let dateFilter: any = {};
      if (timeframe !== 'all') {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = { createdAt: { $gte: startDate } };
      }

      // Build filter for category
      const filter: any = { status: 'active', ...dateFilter };
      if (category) filter.category = category;

      // Get aggregated statistics
      const [
        totalPosts,
        totalComments,
        activeUsers,
        popularTags
      ] = await Promise.all([
        CommunityPost.countDocuments(filter),
        CommunityComment.countDocuments({ ...dateFilter, status: 'visible' }),
        CommunityPost.distinct('authorId', filter).then(authors => 
          CommunityComment.distinct('authorId', { ...dateFilter, status: 'visible' }).then(commenters => 
            new Set([...authors.map(String), ...commenters.map(String)]).size
          )
        ),
        CommunityPost.aggregate([
          { $match: filter },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ])
      ]);

      res.status(200).json({
        success: true,
        message: 'Community statistics retrieved successfully',
        data: {
          overview: {
            totalPosts,
            totalComments,
            totalLikes: 0,
            activeUsers
          },
          topContributors: [],
          popularTags: popularTags.map(tag => ({
            tag: tag._id,
            count: tag.count
          })),
          postsByCategory: [],
          engagementTrends: [],
          timeframe
        }
      });

    } catch (error) {
      logger.error('Error getting community stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve community statistics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get trending posts
   */
  static async getTrendingPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeframe = '24h', // 24h, 7d, 30d
        limit = 10
      } = req.query;

      // Calculate date range
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 30d
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      // Get trending posts based on engagement score
      const trendingPosts = await CommunityPost.aggregate([
        {
          $match: {
            status: 'visible',
            createdAt: { $gte: startDate }
          }
        },
        {
          $addFields: {
            // Calculate trending score based on likes, comments, views, and recency
            trendingScore: {
              $add: [
                { $multiply: ['$score', 3] },
                { $multiply: ['$commentsCount', 5] },
                {
                  $divide: [
                    { $subtract: [new Date(), '$createdAt'] },
                    3600000 // Convert to hours
                  ]
                }
              ]
            }
          }
        },
        { $sort: { trendingScore: -1 } },
        { $limit: Number(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
            pipeline: [
              { $project: { username: 1, profilePicture: 1, bio: 1, expertiseLevel: 1 } }
            ]
          }
        },
        {
          $lookup: {
            from: 'plants',
            localField: 'plantId',
            foreignField: '_id',
            as: 'plant',
            pipeline: [
              { $project: { name: 1, species: 1, images: 1 } }
            ]
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ['$author', 0] },
            plant: { $arrayElemAt: ['$plant', 0] },
            category: '$category'
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: 'Trending posts retrieved successfully',
        data: {
          posts: trendingPosts,
          timeframe
        }
      });

    } catch (error) {
      logger.error('Error getting trending posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trending posts',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
}
