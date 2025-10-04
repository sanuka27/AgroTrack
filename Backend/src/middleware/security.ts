import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import ExpressBrute from 'express-brute';
import ExpressBruteRedis from 'express-brute-redis';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import redis from '../config/redis';
import logger from '../config/logger';

/**
 * Advanced Security Middleware for AgroTrack API
 * Provides comprehensive protection against common security threats
 */

// =============================================================================
// MONGODB INJECTION PROTECTION
// =============================================================================

/**
 * MongoDB injection sanitization middleware
 * Removes any keys that start with '$' or contain '.'
 */
export const mongoSanitization = mongoSanitize({
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sanitizedKey: key,
      path: req.path,
      method: req.method
    });
  },
  replaceWith: '_'
});

// =============================================================================
// HTTP PARAMETER POLLUTION PROTECTION
// =============================================================================

/**
 * HTTP Parameter Pollution (HPP) protection middleware
 * Prevents duplicate parameters in query strings and form data
 */
export const httpParameterPollution = hpp({
  whitelist: [
    'tags',           // Allow multiple tags in search
    'categories',     // Allow multiple categories
    'types',          // Allow multiple types
    'filters',        // Allow multiple filters
    'sort',           // Allow multiple sort parameters
    'fields'          // Allow field selection
  ]
});

// =============================================================================
// ADVANCED RATE LIMITING
// =============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyPrefix?: string;
}

class AdvancedRateLimiter {
  private redisLimiter: RateLimiterRedis | null = null;
  private memoryLimiter: RateLimiterMemory;

  constructor() {
    try {
      // Try to use Redis if available
      if (redis.isHealthy()) {
        this.redisLimiter = new RateLimiterRedis({
          storeClient: redis,
          keyPrefix: 'agrotrack_rl',
          points: 100, // Default limit
          duration: 60, // Per 60 seconds
          blockDuration: 60, // Block for 60 seconds if limit exceeded
        });
      }
    } catch (error) {
      logger.warn('Redis rate limiter initialization failed, using memory limiter', { error });
    }

    // Fallback to memory limiter
    this.memoryLimiter = new RateLimiterMemory({
      keyPrefix: 'agrotrack_rl_mem',
      points: 100,
      duration: 60,
      blockDuration: 60,
    });
  }

  createLimiter(config: RateLimitConfig) {
    const limiter = this.redisLimiter || this.memoryLimiter;

    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req, config.keyPrefix);

      try {
        await limiter.consume(key);
        next();
      } catch (rejRes: any) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          retryAfter: secs
        });

        res.status(429).json({
          success: false,
          message: 'Too many requests',
          retryAfter: secs
        });
      }
    };
  }

  private generateKey(req: Request, prefix?: string): string {
    const parts = [prefix || 'default'];
    
    // Use user ID if authenticated, otherwise IP
    if ((req as any).user?.id) {
      parts.push(`user:${(req as any).user.id}`);
    } else {
      parts.push(`ip:${req.ip}`);
    }
    
    // Add route-specific identifier
    parts.push(`route:${req.route?.path || req.path}`);
    
    return parts.join(':');
  }
}

export const rateLimiter = new AdvancedRateLimiter();

// =============================================================================
// BRUTE FORCE PROTECTION
// =============================================================================

/**
 * Brute force protection using express-brute
 */
class BruteForceProtection {
  private store: ExpressBruteRedis | null = null;
  private bruteforce: ExpressBrute;
  private bruteforceAuth: ExpressBrute;

  constructor() {
    try {
      if (redis.isHealthy()) {
        this.store = new ExpressBruteRedis({
          client: redis.redis as any, // Cast to satisfy ExpressBruteRedis type requirements
          prefix: 'agrotrack_bf:'
        });
      }
    } catch (error) {
      logger.warn('Redis brute force store initialization failed, using memory store', { error });
    }

    // General brute force protection
    this.bruteforce = new ExpressBrute(this.store || undefined, {
      freeRetries: 5,
      minWait: 5 * 60 * 1000, // 5 minutes
      maxWait: 60 * 60 * 1000, // 1 hour
      lifetime: 24 * 60 * 60, // 24 hours
      failCallback: (req, res, next, nextValidRequestDate) => {
        logger.warn('Brute force attack detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          nextValidRequestDate
        });

        res.status(429).json({
          success: false,
          message: 'Too many failed attempts',
          nextValidRequestDate
        });
      }
    });

    // Authentication-specific brute force protection (stricter)
    this.bruteforceAuth = new ExpressBrute(this.store || undefined, {
      freeRetries: 3,
      minWait: 10 * 60 * 1000, // 10 minutes
      maxWait: 2 * 60 * 60 * 1000, // 2 hours
      lifetime: 24 * 60 * 60, // 24 hours
      failCallback: (req, res, next, nextValidRequestDate) => {
        logger.warn('Authentication brute force attack detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          email: req.body.email,
          nextValidRequestDate
        });

        res.status(429).json({
          success: false,
          message: 'Too many failed login attempts',
          nextValidRequestDate
        });
      }
    });
  }

  // Middleware for general brute force protection
  get general() {
    return this.bruteforce.prevent;
  }

  // Middleware for authentication brute force protection
  get auth() {
    return this.bruteforceAuth.prevent;
  }

  // Reset brute force counter (call on successful operations)
  reset(req: Request) {
    const ip = req.ip || 'unknown';
    if (this.bruteforce.reset) {
      this.bruteforce.reset(ip, '', () => {}); // Provide empty key and no-op callback
    }
    if (this.bruteforceAuth.reset) {
      this.bruteforceAuth.reset(ip, '', () => {}); // Provide empty key and no-op callback
    }
  }
}

export const bruteForce = new BruteForceProtection();

// =============================================================================
// PASSWORD SECURITY
// =============================================================================

export class PasswordSecurity {
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  };

  /**
   * Hash password using Argon2 (recommended)
   */
  static async hashPasswordArgon2(password: string): Promise<string> {
    try {
      return await argon2.hash(password, this.ARGON2_OPTIONS);
    } catch (error) {
      logger.error('Argon2 password hashing failed', { error });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Hash password using bcrypt (fallback)
   */
  static async hashPasswordBcrypt(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    } catch (error) {
      logger.error('Bcrypt password hashing failed', { error });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against Argon2 hash
   */
  static async verifyPasswordArgon2(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      logger.error('Argon2 password verification failed', { error });
      return false;
    }
  }

  /**
   * Verify password against bcrypt hash
   */
  static async verifyPasswordBcrypt(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Bcrypt password verification failed', { error });
      return false;
    }
  }

  /**
   * Auto-detect hash type and verify
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Argon2 hashes start with $argon2
    if (hash.startsWith('$argon2')) {
      return this.verifyPasswordArgon2(password, hash);
    }
    
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    if (hash.startsWith('$2')) {
      return this.verifyPasswordBcrypt(password, hash);
    }

    logger.warn('Unknown password hash format detected', { hashPrefix: hash.substring(0, 10) });
    return false;
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common patterns check
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123456|abcdef|qwerty|password/i, // Common sequences
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 1;
        feedback.push('Avoid common patterns and repeated characters');
        break;
      }
    }

    return {
      score: Math.max(0, score),
      feedback,
      isStrong: score >= 5
    };
  }
}

// =============================================================================
// INPUT SANITIZATION & VALIDATION
// =============================================================================

export class SecurityValidator {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Remove script tags and their content
    let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gis, '');
    
    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: protocols (except for images)
    sanitized = sanitized.replace(/data:(?!image\/)/gi, '');

    return sanitized.trim();
  }

  /**
   * Validate and sanitize email addresses
   */
  static validateEmail(email: string): { isValid: boolean; sanitized: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    const sanitized = validator.normalizeEmail(email.trim().toLowerCase()) || '';
    const isValid = validator.isEmail(sanitized);

    return { isValid, sanitized };
  }

  /**
   * Validate URL and prevent malicious URLs
   */
  static validateUrl(url: string): { isValid: boolean; sanitized: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    const sanitized = url.trim();
    
    // Check for valid URL format
    if (!validator.isURL(sanitized, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false
    })) {
      return { isValid: false, sanitized };
    }

    // Block suspicious domains/IPs
    const suspiciousPatterns = [
      /localhost/i,
      /127\.0\.0\.1/,
      /0\.0\.0\.0/,
      /192\.168\./,
      /10\./,
      /172\.(1[6-9]|2[0-9]|3[01])\./
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        return { isValid: false, sanitized };
      }
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate and sanitize user input
   */
  static sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeHtml(input);
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item));
    }

    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        // Sanitize key names
        const cleanKey = key.replace(/[^\w\s-_]/g, '');
        if (cleanKey !== key) {
          logger.warn('Potentially malicious key detected', { originalKey: key, sanitizedKey: cleanKey });
        }
        sanitized[cleanKey] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }

    return input;
  }
}

// =============================================================================
// JWT SECURITY ENHANCEMENTS
// =============================================================================

export class JWTSecurity {
  private static readonly ALGORITHM = 'HS256';
  private static readonly DEFAULT_EXPIRY = '15m';
  private static readonly REFRESH_EXPIRY = '7d';

  /**
   * Generate secure JWT token with additional claims
   */
  static generateToken(payload: object, expiresIn: string = this.DEFAULT_EXPIRY): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const now = Math.floor(Date.now() / 1000);
    const enhancedPayload = {
      ...payload,
      iat: now,
      jti: crypto.randomUUID(), // JWT ID for revocation
      iss: 'agrotrack-api', // Issuer
      aud: 'agrotrack-client' // Audience
    };

    return jwt.sign(enhancedPayload, jwtSecret, {
      expiresIn,
      algorithm: this.ALGORITHM as jwt.Algorithm
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token with additional security checks
   */
  static verifyToken(token: string): any {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: [this.ALGORITHM],
        issuer: 'agrotrack-api',
        audience: 'agrotrack-client'
      });

      return decoded;
    } catch (error) {
      logger.warn('JWT verification failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string): string {
    return this.generateToken({ userId, type: 'refresh' }, this.REFRESH_EXPIRY);
  }
}

// =============================================================================
// CSRF PROTECTION
// =============================================================================

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  static validateToken(sessionToken: string, requestToken: string): boolean {
    if (!sessionToken || !requestToken) return false;
    return crypto.timingSafeEqual(
      Buffer.from(sessionToken, 'hex'),
      Buffer.from(requestToken, 'hex')
    );
  }

  /**
   * CSRF middleware
   */
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip CSRF for API requests with valid JWT
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return next();
      }

      const sessionToken = (req.session as any)?.csrfToken;
      const requestToken = req.headers['x-csrf-token'] || req.body._csrf;

      if (!this.validateToken(sessionToken, requestToken)) {
        logger.warn('CSRF token validation failed', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token'
        });
      }

      next();
    };
  }
}

// =============================================================================
// SECURITY MIDDLEWARE FACTORY
// =============================================================================

export class SecurityMiddlewareFactory {
  /**
   * Create security middleware stack for different endpoint types
   */
  static createSecurityStack(type: 'auth' | 'api' | 'admin' | 'public' = 'api') {
    const middlewares = [];

    // Base security for all endpoints
    middlewares.push(mongoSanitization);
    middlewares.push(httpParameterPollution);

    switch (type) {
      case 'auth':
        middlewares.push(bruteForce.auth);
        middlewares.push(rateLimiter.createLimiter({
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 10, // Strict limit for auth
          keyPrefix: 'auth'
        }));
        break;

      case 'admin':
        middlewares.push(bruteForce.general);
        middlewares.push(rateLimiter.createLimiter({
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 30, // Moderate limit for admin
          keyPrefix: 'admin'
        }));
        break;

      case 'api':
        middlewares.push(rateLimiter.createLimiter({
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 60, // Standard API limit
          keyPrefix: 'api'
        }));
        break;

      case 'public':
        middlewares.push(rateLimiter.createLimiter({
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 100, // Higher limit for public endpoints
          keyPrefix: 'public'
        }));
        break;
    }

    return middlewares;
  }

  /**
   * Security validation middleware
   */
  static securityValidation() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize all input data
      if (req.body) {
        req.body = SecurityValidator.sanitizeUserInput(req.body);
      }
      
      if (req.query) {
        req.query = SecurityValidator.sanitizeUserInput(req.query);
      }

      if (req.params) {
        req.params = SecurityValidator.sanitizeUserInput(req.params);
      }

      next();
    };
  }
}

// Export commonly used configurations
export const securityMiddleware = {
  auth: SecurityMiddlewareFactory.createSecurityStack('auth'),
  api: SecurityMiddlewareFactory.createSecurityStack('api'),
  admin: SecurityMiddlewareFactory.createSecurityStack('admin'),
  public: SecurityMiddlewareFactory.createSecurityStack('public'),
  validation: SecurityMiddlewareFactory.securityValidation()
};