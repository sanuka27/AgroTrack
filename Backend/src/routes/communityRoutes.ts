import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { CommunityController } from '../controllers/communityController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';

const router = express.Router();

// Rate limiting for community operations
const communityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    error: 'Too many community requests from this IP, please try again later.'
  }
});

const postCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per hour
  message: {
    error: 'Too many posts created from this IP, please try again later.'
  }
});

const commentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 comments per window
  message: {
    error: 'Too many comments from this IP, please try again later.'
  }
});

const likeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 likes per window
  message: {
    error: 'Too many like actions from this IP, please try again later.'
  }
});

const moderationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 moderation actions per hour
  message: {
    error: 'Too many moderation reports from this IP, please try again later.'
  }
});

// Validation schemas
const createPostValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10,000 characters')
    .trim(),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),
  
  body('tags.*')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Tags can only contain letters, numbers, hyphens, and underscores'),
  
  body('postType')
    .optional()
    .isIn(['discussion', 'question', 'tip', 'showcase', 'help-request', 'success-story'])
    .withMessage('Post type must be discussion, question, tip, showcase, help-request, or success-story'),
  
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Images must be an array with maximum 5 items'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
  
  body('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  body('expertiseLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Expertise level must be beginner, intermediate, advanced, or expert')
];

const updatePostValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),
  
  body('content')
    .optional()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10,000 characters')
    .trim(),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),
  
  body('tags.*')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Tags can only contain letters, numbers, hyphens, and underscores'),
  
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Images must be an array with maximum 5 items'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
  
  body('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  body('expertiseLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Expertise level must be beginner, intermediate, advanced, or expert')
];

const searchPostsValidation = [
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  
  query('postType')
    .optional()
    .isIn(['discussion', 'question', 'tip', 'showcase', 'help-request', 'success-story'])
    .withMessage('Post type must be discussion, question, tip, showcase, help-request, or success-story'),
  
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value) && value.length <= 10) return true;
      throw new Error('Tags must be a string or array with maximum 10 items');
    }),
  
  query('expertiseLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Expertise level must be beginner, intermediate, advanced, or expert'),
  
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Author must be a valid MongoDB ObjectId'),
  
  query('plantId')
    .optional()
    .isMongoId()
    .withMessage('Plant ID must be a valid MongoDB ObjectId'),
  
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),
  
  query('status')
    .optional()
    .isIn(['active', 'archived', 'deleted'])
    .withMessage('Status must be active, archived, or deleted'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'popularity', 'engagement', 'title'])
    .withMessage('Sort by must be createdAt, updatedAt, popularity, engagement, or title'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const postIdValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

const commentIdValidation = [
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID format')
];

const addCommentValidation = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment content must be between 1 and 2000 characters')
    .trim(),
  
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Parent comment ID must be a valid MongoDB ObjectId'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean')
];

const updateCommentValidation = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment content must be between 1 and 2000 characters')
    .trim()
];

const getCommentsValidation = [
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'popularity'])
    .withMessage('Sort by must be createdAt or popularity'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const toggleLikeValidation = [
  body('targetId')
    .notEmpty()
    .withMessage('Target ID is required')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ObjectId'),
  
  body('targetType')
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(['post', 'comment'])
    .withMessage('Target type must be post or comment')
];

const flagContentValidation = [
  body('targetId')
    .notEmpty()
    .withMessage('Target ID is required')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ObjectId'),
  
  body('targetType')
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(['post', 'comment'])
    .withMessage('Target type must be post or comment'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['spam', 'harassment', 'hate-speech', 'misinformation', 'inappropriate', 'copyright', 'other'])
    .withMessage('Reason must be spam, harassment, hate-speech, misinformation, inappropriate, copyright, or other'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim()
];

const communityStatsValidation = [
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Timeframe must be 7d, 30d, 90d, 1y, or all'),
  
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId')
];

const trendingPostsValidation = [
  query('timeframe')
    .optional()
    .isIn(['24h', '7d', '30d'])
    .withMessage('Timeframe must be 24h, 7d, or 30d'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Forum Posts routes
router.post('/posts', 
  postCreationRateLimit,
  authMiddleware,
  createPostValidation,
  validate,
  CommunityController.createPost
);

router.get('/posts', 
  communityRateLimit,
  searchPostsValidation,
  validate,
  CommunityController.getPosts
);

router.get('/posts/trending', 
  communityRateLimit,
  trendingPostsValidation,
  validate,
  CommunityController.getTrendingPosts
);

router.get('/posts/:postId', 
  communityRateLimit,
  postIdValidation,
  validate,
  CommunityController.getPostById
);

router.put('/posts/:postId', 
  communityRateLimit,
  authMiddleware,
  postIdValidation,
  updatePostValidation,
  validate,
  CommunityController.updatePost
);

router.delete('/posts/:postId', 
  communityRateLimit,
  authMiddleware,
  postIdValidation,
  validate,
  CommunityController.deletePost
);

// Comments routes
router.post('/posts/:postId/comments', 
  commentRateLimit,
  authMiddleware,
  postIdValidation,
  addCommentValidation,
  validate,
  CommunityController.addComment
);

router.get('/posts/:postId/comments', 
  communityRateLimit,
  postIdValidation,
  getCommentsValidation,
  validate,
  CommunityController.getComments
);

router.put('/comments/:commentId', 
  communityRateLimit,
  authMiddleware,
  commentIdValidation,
  updateCommentValidation,
  validate,
  CommunityController.updateComment
);

router.delete('/comments/:commentId', 
  communityRateLimit,
  authMiddleware,
  commentIdValidation,
  validate,
  CommunityController.deleteComment
);

// Likes and reactions routes
router.post('/likes', 
  likeRateLimit,
  authMiddleware,
  toggleLikeValidation,
  validate,
  CommunityController.toggleLike
);

// Content moderation routes
router.post('/flag', 
  moderationRateLimit,
  authMiddleware,
  flagContentValidation,
  validate,
  CommunityController.flagContent
);

// Community statistics routes
router.get('/stats', 
  communityRateLimit,
  communityStatsValidation,
  validate,
  CommunityController.getCommunityStats
);

export default router;