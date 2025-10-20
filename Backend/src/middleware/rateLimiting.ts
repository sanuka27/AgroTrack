import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Define rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth requests per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Login attempts (very strict)
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login attempts per windowMs
    message: {
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  },

  // Password reset (strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 password reset attempts per hour
    message: {
      success: false,
      message: 'Too many password reset attempts, please try again after 1 hour.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Search endpoints
  search: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 search requests per windowMs
    message: {
      success: false,
      message: 'Too many search requests, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File upload endpoints (strict)
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 uploads per windowMs
    message: {
      success: false,
      message: 'Too many file uploads, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Admin endpoints (very strict)
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 admin requests per windowMs
    message: {
      success: false,
      message: 'Too many admin requests, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Sensitive admin operations (extremely strict)
  sensitiveAdmin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 sensitive admin operations per windowMs
    message: {
      success: false,
      message: 'Too many sensitive operations, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // AI/ML endpoints (moderate)
  ai: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 AI requests per windowMs
    message: {
      success: false,
      message: 'Too many AI requests, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Community/social endpoints
  community: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 community requests per windowMs
    message: {
      success: false,
      message: 'Too many community requests, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Analytics endpoints
  analytics: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 analytics requests per windowMs
    message: {
      success: false,
      message: 'Too many analytics requests, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Export/Import operations (strict)
  exportImport: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 export/import operations per hour
    message: {
      success: false,
      message: 'Too many export/import operations, please try again after 1 hour.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }
};

// Create rate limiters for different endpoint types
export const generalLimiter = rateLimit(rateLimitConfigs.general);
export const authLimiter = rateLimit(rateLimitConfigs.auth);
export const loginLimiter = rateLimit(rateLimitConfigs.login);
export const passwordResetLimiter = rateLimit(rateLimitConfigs.passwordReset);
export const searchLimiter = rateLimit(rateLimitConfigs.search);
export const uploadLimiter = rateLimit(rateLimitConfigs.upload);
export const adminLimiter = rateLimit(rateLimitConfigs.admin);
export const sensitiveAdminLimiter = rateLimit(rateLimitConfigs.sensitiveAdmin);
export const aiLimiter = rateLimit(rateLimitConfigs.ai);
export const communityLimiter = rateLimit(rateLimitConfigs.community);
export const analyticsLimiter = rateLimit(rateLimitConfigs.analytics);
export const exportImportLimiter = rateLimit(rateLimitConfigs.exportImport);

// Custom rate limiter with user-based limits (for authenticated users)
export const createUserBasedLimiter = (config: {
  windowMs: number;
  max: number;
  premiumMax?: number;
  message: any;
}) => {
  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => {
      // Use user ID for authenticated users, IP for anonymous
      const user = (req as any).user;
      if (user) {
        // Premium users get higher limits
        const isPremium = user.subscription === 'premium' || user.role === 'admin';
        return `user:${user.id}:${isPremium ? 'premium' : 'standard'}`;
      }
      return req.ip || 'unknown';
    },
    max: (req: Request) => {
      const user = (req as any).user;
      if (user) {
        const isPremium = user.subscription === 'premium' || user.role === 'admin';
        return isPremium ? (config.premiumMax || config.max * 2) : config.max;
      }
      return Math.floor(config.max * 0.5); // Anonymous users get lower limits
    }
  });
};

// Burst rate limiter for high-frequency operations
export const burstLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per minute (increased for local dev)
  message: {
    success: false,
    message: 'Too many requests per minute, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sliding window rate limiter for more sophisticated control
export const slidingWindowLimiter = (options: {
  windowMs: number;
  max: number;
  message?: any;
}) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: (error?: any) => void) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean up old entries
    for (const [k, v] of requestCounts.entries()) {
      if (v.resetTime < windowStart) {
        requestCounts.delete(k);
      }
    }
    
    const current = requestCounts.get(key) || { count: 0, resetTime: now + options.windowMs };
    
    if (current.resetTime < now) {
      // Reset window
      current.count = 0;
      current.resetTime = now + options.windowMs;
    }
    
    current.count++;
    requestCounts.set(key, current);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': options.max.toString(),
      'X-RateLimit-Remaining': Math.max(0, options.max - current.count).toString(),
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
    });
    
    if (current.count > options.max) {
      res.status(429).json(options.message || {
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
      return;
    }
    
    next();
  };
};

// Dynamic rate limiter that adjusts based on system load
export const adaptiveLimiter = (baseConfig: {
  windowMs: number;
  max: number;
  message: any;
}) => {
  return rateLimit({
    ...baseConfig,
    max: (req: Request) => {
      // Adjust rate limit based on system load
      const memoryUsage = process.memoryUsage();
      const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (heapUsedPercentage > 0.9) {
        return Math.floor(baseConfig.max * 0.5); // Reduce limits when memory is high
      } else if (heapUsedPercentage > 0.7) {
        return Math.floor(baseConfig.max * 0.75);
      }
      
      return baseConfig.max;
    }
  });
};

// Rate limiter with custom skip logic
export const conditionalLimiter = (config: {
  windowMs: number;
  max: number;
  message: any;
  skipIf?: (req: Request) => boolean;
}) => {
  const limiter = rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: true,
    legacyHeaders: false,
    skip: config.skipIf || (() => false)
  });
  
  return limiter;
};

// Whitelist-based rate limiter
export const whitelistLimiter = (config: {
  windowMs: number;
  max: number;
  message: any;
  whitelist: string[];
}) => {
  return rateLimit({
    ...config,
    skip: (req: Request) => {
      return config.whitelist.includes(req.ip || 'unknown');
    }
  });
};

// Global rate limiting middleware for all routes
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Global limit per IP (increased for local dev)
  message: {
    success: false,
    message: 'Global rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`Global rate limit exceeded for IP: ${req.ip || 'unknown'}`);
    res.status(429).json({
      success: false,
      message: 'Global rate limit exceeded. Please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limit monitoring and analytics
export class RateLimitMonitor {
  private static instance: RateLimitMonitor;
  private violations: Map<string, { count: number; lastViolation: Date }> = new Map();
  
  static getInstance(): RateLimitMonitor {
    if (!RateLimitMonitor.instance) {
      RateLimitMonitor.instance = new RateLimitMonitor();
    }
    return RateLimitMonitor.instance;
  }
  
  recordViolation(ip: string, endpoint: string): void {
    const key = `${ip}:${endpoint}`;
    const current = this.violations.get(key) || { count: 0, lastViolation: new Date() };
    current.count++;
    current.lastViolation = new Date();
    this.violations.set(key, current);
    
    // Log severe violations
    if (current.count > 10) {
      console.error(`Severe rate limit violations from IP ${ip} on endpoint ${endpoint}: ${current.count} violations`);
    }
  }
  
  getViolations(): Map<string, { count: number; lastViolation: Date }> {
    return this.violations;
  }
  
  clearOldViolations(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    for (const [key, violation] of this.violations.entries()) {
      if (violation.lastViolation < cutoff) {
        this.violations.delete(key);
      }
    }
  }
}

// Enhanced rate limiter with monitoring
export const monitoredLimiter = (config: {
  windowMs: number;
  max: number;
  message: any;
  endpoint: string;
}) => {
  const monitor = RateLimitMonitor.getInstance();
  
  return rateLimit({
    ...config,
    handler: (req: Request, res: Response) => {
      monitor.recordViolation(req.ip || 'unknown', config.endpoint);
      res.status(429).json({
        ...config.message,
        timestamp: new Date().toISOString(),
        endpoint: config.endpoint
      });
    }
  });
};

export default {
  generalLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  searchLimiter,
  uploadLimiter,
  adminLimiter,
  sensitiveAdminLimiter,
  aiLimiter,
  communityLimiter,
  analyticsLimiter,
  exportImportLimiter,
  burstLimiter,
  globalRateLimit,
  createUserBasedLimiter,
  slidingWindowLimiter,
  adaptiveLimiter,
  conditionalLimiter,
  whitelistLimiter,
  monitoredLimiter,
  RateLimitMonitor
};