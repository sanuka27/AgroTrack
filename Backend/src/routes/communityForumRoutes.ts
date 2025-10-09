import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param } from 'express-validator';
import { CommunityForumController } from '../controllers/communityForumController';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';

const router = express.Router();

// Rate limiting for forum operations
const postRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per hour
  message: {
    error: 'Too many posts created from this IP, please try again later.'
  }
});

const commentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 comments per 15 minutes
  message: {
    error: 'Too many comments from this IP, please try again later.'
  }
});

const voteRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 votes per minute
  message: {
    error: 'Too many vote requests from this IP, please slow down.'
  }
});

// Validation schemas
const createPostValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('bodyMarkdown')
    .notEmpty()
    .withMessage('Post body is required')
    .isLength({ max: 10000 })
    .withMessage('Post body cannot exceed 10000 characters'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid'),
  
  body('images.*.width')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Image width must be a positive integer'),
  
  body('images.*.height')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Image height must be a positive integer'),
];

const voteValidation = [
  body('value')
    .notEmpty()
    .withMessage('Vote value is required')
    .isIn([1, -1])
    .withMessage('Vote value must be 1 (upvote) or -1 (downvote)'),
];

const createCommentValidation = [
  body('bodyMarkdown')
    .notEmpty()
    .withMessage('Comment body is required')
    .isLength({ max: 5000 })
    .withMessage('Comment body cannot exceed 5000 characters'),
];

const createReportValidation = [
  body('targetType')
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(['post', 'comment'])
    .withMessage('Target type must be post or comment'),
  
  body('targetId')
    .notEmpty()
    .withMessage('Target ID is required')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ObjectId'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['spam', 'harassment', 'inappropriate-content', 'misinformation', 'off-topic', 'duplicate', 'other'])
    .withMessage('Invalid reason'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
];

const postListValidation = [
  query('sort')
    .optional()
    .isIn(['top', 'latest'])
    .withMessage('Sort must be top or latest'),
  
  query('tag')
    .optional()
    .isString()
    .withMessage('Tag must be a string'),
  
  query('cursor')
    .optional()
    .isMongoId()
    .withMessage('Cursor must be a valid MongoDB ObjectId'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

/**
 * @route   POST /api/community/forum/posts
 * @desc    Create a new forum post
 * @access  Private (requires authentication)
 */
router.post('/posts',
  postRateLimit,
  authMiddleware,
  createPostValidation,
  validate,
  CommunityForumController.createPost
);

/**
 * @route   GET /api/community/forum/posts
 * @desc    Get forum posts with pagination and filtering
 * @access  Public (with optional auth)
 */
router.get('/posts',
  optionalAuth,
  postListValidation,
  validate,
  CommunityForumController.getPosts
);

/**
 * @route   GET /api/community/forum/posts/:id
 * @desc    Get a single post by ID
 * @access  Public (with optional auth)
 */
router.get('/posts/:id',
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid post ID'),
  validate,
  CommunityForumController.getPostById
);

/**
 * @route   POST /api/community/forum/posts/:id/vote
 * @desc    Vote on a post (upvote or downvote)
 * @access  Private (requires authentication)
 */
router.post('/posts/:id/vote',
  voteRateLimit,
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid post ID'),
  voteValidation,
  validate,
  CommunityForumController.votePost
);

/**
 * @route   POST /api/community/forum/posts/:id/comments
 * @desc    Create a comment on a post
 * @access  Private (requires authentication)
 */
router.post('/posts/:id/comments',
  commentRateLimit,
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid post ID'),
  createCommentValidation,
  validate,
  CommunityForumController.createComment
);

/**
 * @route   GET /api/community/forum/posts/:id/comments
 * @desc    Get comments for a post
 * @access  Public (with optional auth)
 */
router.get('/posts/:id/comments',
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid post ID'),
  query('cursor').optional().isMongoId().withMessage('Invalid cursor'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate,
  CommunityForumController.getComments
);

/**
 * @route   POST /api/community/forum/reports
 * @desc    Report a post or comment
 * @access  Private (requires authentication)
 */
router.post('/reports',
  authMiddleware,
  createReportValidation,
  validate,
  CommunityForumController.createReport
);

/**
 * @route   PATCH /api/community/forum/posts/:id/solved
 * @desc    Toggle solved status on a post (by OP or moderator)
 * @access  Private (requires authentication)
 */
router.patch('/posts/:id/solved',
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid post ID'),
  body('isSolved').optional().isBoolean().withMessage('isSolved must be a boolean'),
  validate,
  CommunityForumController.toggleSolved
);

/**
 * @route   GET /api/community/forum/tags/trending
 * @desc    Get trending tags
 * @access  Public
 */
router.get('/tags/trending',
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  validate,
  CommunityForumController.getTrendingTags
);

/**
 * @route   POST /api/community/forum/users/profile
 * @desc    Get or create community user profile
 * @access  Private (requires authentication)
 */
router.post('/users/profile',
  authMiddleware,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('avatarUrl').optional().isURL().withMessage('Avatar URL must be valid'),
  validate,
  CommunityForumController.getOrCreateProfile
);

/**
 * @route   POST /api/community/forum/upload
 * @desc    Upload images for forum posts (placeholder - use Firebase Storage directly from client)
 * @access  Private (requires authentication)
 */
router.post('/upload',
  authMiddleware,
  CommunityForumController.uploadImage
);

export default router;
