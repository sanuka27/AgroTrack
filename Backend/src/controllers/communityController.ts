import { Request, Response } from 'express';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Like } from '../models/Like';
import { BlogPost } from '../models/BlogPost';
import { BlogCategory } from '../models/BlogCategory';
import { BlogSeries } from '../models/BlogSeries';
import { BlogTag } from '../models/BlogTag';
import { User } from '../models/User';
import { UserAnalytics } from '../models/UserAnalytics';
import logger from '../config/logger';

export class CommunityController {
  
  // Forum Posts CRUD Operations
  
  /**
   * Create a new forum post
   */
  static async createPost(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
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
      const post = new Post({
        title,
        content,
        category,
        tags,
        postType,
        author: userId,
        images,
        isAnonymous,
        allowComments,
        plantId,
        expertiseLevel,
        status: 'active',
        engagement: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        },
        moderation: {
          flagged: false,
          approved: true,
          flagCount: 0
        }
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
      const populatedPost = await Post.findById(post._id)
        .populate('author', 'username profilePicture bio expertiseLevel')
        .populate('plantId', 'name species images')
        .populate('category', 'name description');

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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get forum posts with filtering and pagination
   */
  static async getPosts(req: Request, res: Response) {
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
      const filter: any = { status };

      if (category) filter.category = category;
      if (postType) filter.postType = postType;
      if (expertiseLevel) filter.expertiseLevel = expertiseLevel;
      if (author) filter.author = author;
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
      const posts = await Post.find(filter)
        .populate('author', 'username profilePicture bio expertiseLevel')
        .populate('plantId', 'name species images')
        .populate('category', 'name description color')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Get total count for pagination
      const totalPosts = await Post.countDocuments(filter);
      const totalPages = Math.ceil(totalPosts / Number(limit));

      // Update view counts for posts
      const postIds = posts.map(post => post._id);
      await Post.updateMany(
        { _id: { $in: postIds } },
        { $inc: { 'engagement.views': 1 } }
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get a single forum post by ID
   */
  static async getPostById(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.id;

      const post = await Post.findById(postId)
        .populate('author', 'username profilePicture bio expertiseLevel')
        .populate('plantId', 'name species images')
        .populate('category', 'name description color');

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }

      // Increment view count (only once per user session)
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'engagement.views': 1 }
      });

      // Check if user has liked this post
      let hasLiked = false;
      if (userId) {
        const like = await Like.findOne({
          targetId: postId,
          targetType: 'post',
          userId
        });
        hasLiked = !!like;
      }

      res.status(200).json({
        success: true,
        message: 'Forum post retrieved successfully',
        data: {
          post: {
            ...post.toObject(),
            hasLiked
          }
        }
      });

    } catch (error) {
      logger.error('Error getting forum post by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve forum post',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update a forum post
   */
  static async updatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      // Find the post
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }

      // Check ownership
      if (post.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this post'
        });
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

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('author', 'username profilePicture bio expertiseLevel')
       .populate('plantId', 'name species images')
       .populate('category', 'name description color');

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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete a forum post
   */
  static async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Find the post
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }

      // Check authorization (owner or admin/moderator)
      if (post.author.toString() !== userId && !['admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this post'
        });
      }

      // Soft delete - update status instead of removing
      await Post.findByIdAndUpdate(postId, {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: userId
      });

      // Also delete associated likes and comments
      await Like.updateMany(
        { targetId: postId, targetType: 'post' },
        { status: 'deleted', deletedAt: new Date() }
      );

      await Comment.updateMany(
        { postId },
        { status: 'deleted', deletedAt: new Date() }
      );

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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Comments Management
  
  /**
   * Add a comment to a post
   */
  static async addComment(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?.id;
      const { content, parentCommentId, isAnonymous = false } = req.body;

      // Check if post exists and allows comments
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
      }

      if (!post.allowComments) {
        return res.status(403).json({
          success: false,
          message: 'Comments are not allowed on this post'
        });
      }

      // Create comment
      const comment = new Comment({
        content,
        author: userId,
        postId,
        parentCommentId,
        isAnonymous,
        status: 'active',
        engagement: {
          likes: 0,
          replies: 0
        }
      });

      await comment.save();

      // Update post comment count
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'engagement.comments': 1 }
      });

      // Update parent comment reply count if this is a reply
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $inc: { 'engagement.replies': 1 }
        });
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
      const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'username profilePicture bio expertiseLevel');

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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get comments for a post
   */
  static async getComments(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const {
        sortBy = 'createdAt',
        sortOrder = 'asc',
        page = 1,
        limit = 50
      } = req.query;

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Forum post not found'
        });
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
      const comments = await Comment.find({
        postId,
        parentCommentId: null,
        status: 'active'
      })
      .populate('author', 'username profilePicture bio expertiseLevel')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await Comment.find({
            parentCommentId: comment._id,
            status: 'active'
          })
          .populate('author', 'username profilePicture bio expertiseLevel')
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
      const totalComments = await Comment.countDocuments({
        postId,
        parentCommentId: null,
        status: 'active'
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user?.id;
      const { content } = req.body;

      // Find the comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check ownership
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this comment'
        });
      }

      // Update comment
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          content,
          editedAt: new Date(),
          editCount: (comment.editCount || 0) + 1
        },
        { new: true, runValidators: true }
      ).populate('author', 'username profilePicture bio expertiseLevel');

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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Find the comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check authorization
      if (comment.author.toString() !== userId && !['admin', 'moderator'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment'
        });
      }

      // Soft delete
      await Comment.findByIdAndUpdate(commentId, {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: userId
      });

      // Update post comment count
      await Post.findByIdAndUpdate(comment.postId, {
        $inc: { 'engagement.comments': -1 }
      });

      // Update parent comment reply count if this is a reply
      if (comment.parentCommentId) {
        await Comment.findByIdAndUpdate(comment.parentCommentId, {
          $inc: { 'engagement.replies': -1 }
        });
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Likes and Reactions

  /**
   * Toggle like on a post or comment
   */
  static async toggleLike(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { targetId, targetType } = req.body;

      if (!['post', 'comment'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type. Must be post or comment'
        });
      }

      // Check if target exists
      const Model = targetType === 'post' ? Post : Comment;
      const target = await Model.findById(targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: `${targetType} not found`
        });
      }

      // Check if user already liked this target
      const existingLike = await Like.findOne({
        targetId,
        targetType,
        userId
      });

      let isLiked = false;
      let likesCount = target.engagement?.likes || 0;

      if (existingLike) {
        // Unlike - remove the like
        await Like.findByIdAndDelete(existingLike._id);
        likesCount = Math.max(0, likesCount - 1);
        isLiked = false;

        // Update user analytics
        await UserAnalytics.findOneAndUpdate(
          { userId },
          {
            $inc: {
              'community.likesGiven': -1,
              'engagement.totalActions': -1
            }
          }
        );

      } else {
        // Like - create new like
        const like = new Like({
          targetId,
          targetType,
          userId,
          likeType: 'like'
        });
        await like.save();
        
        likesCount += 1;
        isLiked = true;

        // Update user analytics
        await UserAnalytics.findOneAndUpdate(
          { userId },
          {
            $inc: {
              'community.likesGiven': 1,
              'engagement.totalActions': 1
            },
            $set: {
              lastActivityDate: new Date()
            }
          },
          { upsert: true }
        );

        // Update target author's analytics (likes received)
        await UserAnalytics.findOneAndUpdate(
          { userId: target.author },
          {
            $inc: {
              'community.likesReceived': 1
            }
          },
          { upsert: true }
        );
      }

      // Update target likes count
      await Model.findByIdAndUpdate(targetId, {
        'engagement.likes': likesCount
      });

      logger.info(`Like toggled on ${targetType} ${targetId} by user ${userId}: ${isLiked ? 'liked' : 'unliked'}`);

      res.status(200).json({
        success: true,
        message: `${targetType} ${isLiked ? 'liked' : 'unliked'} successfully`,
        data: {
          isLiked,
          likesCount
        }
      });

    } catch (error) {
      logger.error('Error toggling like:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle like',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Content Moderation

  /**
   * Flag a post or comment for moderation
   */
  static async flagContent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { targetId, targetType, reason, description } = req.body;

      if (!['post', 'comment'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type. Must be post or comment'
        });
      }

      // Check if target exists
      const Model = targetType === 'post' ? Post : Comment;
      const target = await Model.findById(targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: `${targetType} not found`
        });
      }

      // Check if user already flagged this content
      const existingFlag = target.moderation?.flags?.find(
        (flag: any) => flag.reportedBy.toString() === userId
      );

      if (existingFlag) {
        return res.status(400).json({
          success: false,
          message: 'You have already flagged this content'
        });
      }

      // Add flag to content
      const flagData = {
        reason,
        description,
        reportedBy: userId,
        reportedAt: new Date()
      };

      await Model.findByIdAndUpdate(targetId, {
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Community Statistics

  /**
   * Get community statistics
   */
  static async getCommunityStats(req: Request, res: Response) {
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
        totalLikes,
        activeUsers,
        topContributors,
        popularTags,
        postsByCategory,
        engagementTrends
      ] = await Promise.all([
        // Total posts
        Post.countDocuments(filter),
        
        // Total comments
        Comment.countDocuments({ ...dateFilter, status: 'active' }),
        
        // Total likes
        Like.countDocuments(dateFilter),
        
        // Active users (users who posted or commented)
        Post.distinct('author', filter).then(authors => 
          Comment.distinct('author', { ...dateFilter, status: 'active' }).then(commenters => 
            new Set([...authors.map(String), ...commenters.map(String)]).size
          )
        ),
        
        // Top contributors
        UserAnalytics.find({})
          .sort({ 'community.postsCreated': -1, 'community.commentsPosted': -1 })
          .limit(10)
          .populate('userId', 'username profilePicture bio')
          .lean(),
        
        // Popular tags
        Post.aggregate([
          { $match: filter },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ]),
        
        // Posts by category
        Post.aggregate([
          { $match: filter },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $lookup: {
            from: 'blogcategories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo'
          }},
          { $sort: { count: -1 } }
        ]),
        
        // Engagement trends (last 7 days)
        Post.aggregate([
          {
            $match: {
              status: 'active',
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              posts: { $sum: 1 },
              totalLikes: { $sum: '$engagement.likes' },
              totalComments: { $sum: '$engagement.comments' }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      res.status(200).json({
        success: true,
        message: 'Community statistics retrieved successfully',
        data: {
          overview: {
            totalPosts,
            totalComments,
            totalLikes,
            activeUsers
          },
          topContributors: topContributors.map(user => ({
            user: user.userId,
            stats: {
              postsCreated: user.community?.postsCreated || 0,
              commentsPosted: user.community?.commentsPosted || 0,
              likesReceived: user.community?.likesReceived || 0
            }
          })),
          popularTags: popularTags.map(tag => ({
            tag: tag._id,
            count: tag.count
          })),
          postsByCategory,
          engagementTrends,
          timeframe
        }
      });

    } catch (error) {
      logger.error('Error getting community stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve community statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get trending posts
   */
  static async getTrendingPosts(req: Request, res: Response) {
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
      const trendingPosts = await Post.aggregate([
        {
          $match: {
            status: 'active',
            createdAt: { $gte: startDate }
          }
        },
        {
          $addFields: {
            // Calculate trending score based on likes, comments, views, and recency
            trendingScore: {
              $add: [
                { $multiply: ['$engagement.likes', 3] },
                { $multiply: ['$engagement.comments', 5] },
                { $multiply: ['$engagement.views', 0.1] },
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
            localField: 'author',
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
          $lookup: {
            from: 'blogcategories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
            pipeline: [
              { $project: { name: 1, description: 1, color: 1 } }
            ]
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ['$author', 0] },
            plant: { $arrayElemAt: ['$plant', 0] },
            category: { $arrayElemAt: ['$category', 0] }
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}