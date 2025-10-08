import { Router } from 'express';
import { body, param } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { authLimiter, loginLimiter, passwordResetLimiter } from '../middleware/rateLimiting';
import passport from 'passport';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { firebaseService } from '../config/firebase';
import { logger } from '../config/logger';

const router = Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['guest', 'user', 'admin'])
    .withMessage('Role must be guest, user, or admin')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format')
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const emailVerificationValidation = [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid verification token format')
];

const resendVerificationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Routes

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user account
 *     description: Create a new user account with email verification
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z\s]+$'
 *                 example: 'John Doe'
 *                 description: 'Full name (letters and spaces only)'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john.doe@example.com'
 *                 description: 'Valid email address'
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
 *                 example: 'SecurePass123!'
 *                 description: 'Password with uppercase, lowercase, number, and special character'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'User registered successfully. Please check your email for verification.'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                     refreshToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'User with this email already exists'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register', 
  authLimiter,
  registerValidation,
  validate,
  AuthController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email and password
 *     description: Authenticate user and return access/refresh tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john.doe@example.com'
 *               password:
 *                 type: string
 *                 example: 'SecurePass123!'
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *                 description: 'Extended session duration'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Login successful'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                     refreshToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Invalid email or password'
 *       423:
 *         description: Account locked due to too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Account temporarily locked due to too many failed login attempts'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login',
  loginLimiter,
  loginValidation,
  validate,
  AuthController.login
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                 description: 'Valid refresh token'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Token refreshed successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                     refreshToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Invalid or expired refresh token'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh',
  refreshTokenValidation,
  validate,
  AuthController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (remove refresh token)
 * @access  Private
 */
router.post('/logout',
  authMiddleware,
  AuthController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout user from all devices
 * @access  Private
 */
router.post('/logout-all',
  authMiddleware,
  AuthController.logoutAll
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password',
  passwordResetLimiter,
  passwordResetValidation,
  validate,
  AuthController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  authLimiter,
  resetPasswordValidation,
  validate,
  AuthController.resetPassword
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token',
  emailVerificationValidation,
  validate,
  AuthController.verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification',
  passwordResetLimiter, // Same rate limit as password reset
  resendVerificationValidation,
  validate,
  AuthController.resendVerificationEmail
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authMiddleware,
  AuthController.getProfile
);

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Private
 */
router.get('/check', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'User is authenticated',
    data: {
      user: {
        id: (req.user as any)?._id,
        name: (req.user as any)?.name,
        email: (req.user as any)?.email,
        role: (req.user as any)?.role,
        isEmailVerified: (req.user as any)?.isEmailVerified
      }
    }
  });
});

// Helper function to generate JWT tokens
const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  return jwt.sign({ userId }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);
};

// Helper function to generate refresh token
const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret', { 
    expiresIn: '30d' 
  });
};

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags: [Authentication]
 *     summary: Initiate Google OAuth authentication
 *     description: Redirect to Google OAuth consent screen
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Google OAuth callback
 *     description: Handle Google OAuth callback and authenticate user
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: OAuth authorization code
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: OAuth state parameter
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication tokens
 *       400:
 *         description: Authentication failed
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/auth/failure'
  }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.redirect('/auth/failure');
      }

      // Generate tokens
      const token = generateToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        lastActiveAt: new Date()
      });

      logger.info(`Google OAuth login: ${user.email}`);

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect('/auth/failure');
    }
  }
);

/**
 * @swagger
 * /auth/firebase:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate with Firebase ID token
 *     description: Authenticate user using Firebase ID token from client SDK
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN...'
 *                 description: 'Firebase ID token from client SDK'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Authentication successful'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                     refreshToken:
 *                       type: string
 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         description: Invalid Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Invalid Firebase token'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/firebase', async (req, res): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ 
        success: false,
        message: 'Firebase ID token is required' 
      });
      return;
    }

    // Check if Firebase is available
    if (!firebaseService.isFirebaseAvailable()) {
      logger.warn('Firebase not initialized - service unavailable');
      res.status(503).json({
        success: false,
        message: 'Firebase authentication not available - please use email/password registration'
      });
      return;
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await firebaseService.verifyIdToken(idToken);
    } catch (firebaseError) {
      logger.warn('Firebase authentication failed', { error: firebaseError });
      res.status(400).json({
        success: false,
        message: 'Invalid Firebase token'
      });
      return;
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email: decodedToken.email });
      
      if (user) {
        // Link Firebase account to existing user
        user.firebaseUid = decodedToken.uid;
        user.authProvider = 'firebase';
        await user.save();
      } else {
        // Create new user
        user = new User({
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email,
          firebaseUid: decodedToken.uid,
          authProvider: 'firebase',
          status: 'active',
          isEmailVerified: decodedToken.email_verified || false
        });
        await user.save();
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    logger.info(`Firebase authentication: ${user.email}`);

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken: token,
          refreshToken
        }
      }
    });
    return;
  } catch (error) {
    logger.error('Firebase authentication error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     tags: [Authentication]
 *     summary: Authentication failure redirect
 *     description: Endpoint for handling authentication failures
 *     security: []
 *     responses:
 *       400:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Authentication failed'
 */
router.get('/failure', (req, res) => {
  res.status(400).json({ 
    success: false,
    message: 'Authentication failed',
    error: 'Unable to authenticate with the provided credentials'
  });
});

export default router;