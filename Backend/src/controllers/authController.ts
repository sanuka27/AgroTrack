import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose, { Document } from 'mongoose';
import { User, IUser } from '../models/User';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';
import { logger } from '../config/logger';

// Interface for registration request
interface RegisterRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: 'guest' | 'user' | 'admin';
  };
}

// Interface for login request
interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
    rememberMe?: boolean;
  };
}

// Interface for refresh token request
interface RefreshTokenRequest extends Request {
  body: {
    refreshToken: string;
  };
}

// Interface for password reset request
interface PasswordResetRequest extends Request {
  body: {
    email: string;
  };
}

// Interface for password reset confirmation
interface ResetPasswordRequest extends Request {
  body: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  };
}

export class AuthController {
  // User registration
  static async register(req: RegisterRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, confirmPassword, role = 'user' } = req.body;

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          errors: {
            name: !name ? 'Name is required' : undefined,
            email: !email ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined,
            confirmPassword: !confirmPassword ? 'Confirm password is required' : undefined
          }
        });
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
          errors: {
            confirmPassword: 'Passwords do not match'
          }
        });
      }

      // Check password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          errors: {
            password: 'Password does not meet security requirements'
          }
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          errors: {
            email: 'Email is already registered'
          }
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        emailVerificationToken,
        emailVerificationExpires,
        isEmailVerified: false
      });

      await user.save();

      // Generate tokens
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      // Save refresh token
      await user.save();

      // Track registration event
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.USER_REGISTER,
          { method: 'email', role },
          {
            sessionId: req.sessionID,
            deviceInfo: {
              userAgent: req.get('User-Agent'),
              ip: req.ip
            }
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track registration event', { error: analyticsError });
      }

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
          }
        }
      });

    } catch (error) {
      logger.error('Registration error', { error });
      return next(error);
    }
  }

  // User login
  static async login(req: LoginRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, rememberMe = false } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          errors: {
            email: !email ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          errors: {
            credentials: 'Invalid login credentials'
          }
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: `Account is locked due to too many failed login attempts. Please try again after ${user.lockUntil}`,
          errors: {
            account: 'Account is temporarily locked'
          }
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.loginAttempts += 1;
        
        // Lock account after 5 failed attempts for 2 hours
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        }
        
        await user.save();

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          errors: {
            credentials: 'Invalid login credentials'
          }
        });
      }

      // Reset login attempts on successful login
      if (user.loginAttempts && user.loginAttempts > 0) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      // Update last login
      user.lastLogin = new Date();

      // Generate tokens
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      // Save user with new refresh token
      await user.save();

      // Track login event
      try {
        await UserAnalytics.trackEvent(
          user._id,
          AnalyticsEventType.USER_LOGIN,
          { method: 'email', rememberMe },
          {
            sessionId: req.sessionID,
            deviceInfo: {
              userAgent: req.get('User-Agent'),
              ip: req.ip
            }
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track login event', { error: analyticsError });
      }

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
            preferences: user.preferences,
            lastLogin: user.lastLogin
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
          }
        }
      });

    } catch (error) {
      logger.error('Login error', { error });
      return next(error);
    }
  }

  // Refresh access token
  static async refreshToken(req: RefreshTokenRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          errors: {
            refreshToken: 'Refresh token is required'
          }
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret') as any;
      
      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          errors: {
            refreshToken: 'Invalid or expired refresh token'
          }
        });
      }

      // Remove old refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);

      // Generate new tokens
      const newAccessToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      await user.save();

      logger.info('Access token refreshed', { userId: user._id });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
          }
        }
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          errors: {
            refreshToken: 'Invalid or expired refresh token'
          }
        });
      }

      logger.error('Token refresh error', { error });
      return next(error);
    }
  }

  // User logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (req.user && refreshToken) {
        // Remove refresh token from user's token list
        const user = req.user as IUser & Document;
        user.refreshTokens = user.refreshTokens.filter((token: string) => token !== refreshToken);
        await user.save();

        // Track logout event
        try {
          await (UserAnalytics as any).trackEvent(
            user._id,
            AnalyticsEventType.USER_LOGOUT,
            { method: 'manual' },
            {
              sessionId: req.sessionID
            }
          );
        } catch (analyticsError) {
          logger.warn('Failed to track logout event', { error: analyticsError });
        }

        logger.info('User logged out', { userId: user._id });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error', { error });
      next(error);
    }
  }

  // Logout from all devices
  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        // Clear all refresh tokens
        const user = req.user as IUser & Document;
        user.refreshTokens = [];
        await user.save();

        // Track logout all event
        try {
          await (UserAnalytics as any).trackEvent(
            (req.user as IUser & Document)._id,
            AnalyticsEventType.USER_LOGOUT,
            { method: 'all_devices' },
            {
              sessionId: req.sessionID
            }
          );
        } catch (analyticsError) {
          logger.warn('Failed to track logout all event', { error: analyticsError });
        }

        logger.info('User logged out from all devices', { userId: (req.user as IUser & Document)._id });
      }

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });

    } catch (error) {
      logger.error('Logout all error', { error });
      next(error);
    }
  }

  // Request password reset
  static async requestPasswordReset(req: PasswordResetRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
          errors: {
            email: 'Email is required'
          }
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });

      if (!user) {
        logger.warn('Password reset requested for non-existent email', { email });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetTokenExpires;
      await user.save();

      // TODO: Send password reset email
      // await EmailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      logger.info('Password reset requested', { userId: user._id, email: user.email });

    } catch (error) {
      logger.error('Password reset request error', { error });
      return next(error);
    }
  }

  // Reset password with token
  static async resetPassword(req: ResetPasswordRequest, res: Response, next: NextFunction) {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          errors: {
            token: !token ? 'Reset token is required' : undefined,
            newPassword: !newPassword ? 'New password is required' : undefined,
            confirmPassword: !confirmPassword ? 'Confirm password is required' : undefined
          }
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
          errors: {
            confirmPassword: 'Passwords do not match'
          }
        });
      }

      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          errors: {
            newPassword: 'Password does not meet security requirements'
          }
        });
      }

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
          errors: {
            token: 'Reset token is invalid or has expired'
          }
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and clear reset token
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = new Date();
      
      // Clear all refresh tokens to force re-login
      user.refreshTokens = [];
      
      await user.save();

      logger.info('Password reset successful', { userId: user._id });

      res.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.'
      });

    } catch (error) {
      logger.error('Password reset error', { error });
      return next(error);
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      // Find user with valid verification token
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.isEmailVerified = true;

      await user.save();

      logger.info('Email verified successfully', { userId: user._id, email: user.email });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error', { error });
      return next(error);
    }
  }

  // Resend verification email
  static async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      user.emailVerificationToken = emailVerificationToken;
      user.emailVerificationExpires = emailVerificationExpires;
      await user.save();

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

      logger.info('Verification email resent', { userId: user._id, email: user.email });

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      logger.error('Resend verification email error', { error });
      return next(error);
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = req.user as IUser & Document;
      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            preferences: user.preferences,
            stats: user.stats,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          }
        }
      });

    } catch (error) {
      logger.error('Get profile error', { error });
      return next(error);
    }
  }
}
