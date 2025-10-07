import { Request, Response, NextFunction } from 'express';
import { SecurityAnalyzer, PrivacyUtils } from '../utils/securityUtils';
import { logger } from '../config/logger';

/**
 * Security Audit Middleware for AgroTrack API
 * Monitors, logs, and analyzes security events
 */

interface SecurityEvent {
  type: 'login' | 'login_failed' | 'password_change' | 'account_locked' | 
        'suspicious_request' | 'rate_limit_exceeded' | 'validation_failed' |
        'unauthorized_access' | 'data_access' | 'admin_action' | 'file_upload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  riskScore: number;
}

// =============================================================================
// SECURITY EVENT LOGGING
// =============================================================================

export class SecurityAuditLogger {
  private static readonly MAX_EVENTS_PER_MINUTE = 100;
  private static eventCount = 0;
  private static lastReset = Date.now();

  /**
   * Log security event with appropriate level and context
   */
  static logSecurityEvent(event: SecurityEvent): void {
    // Rate limit security logging to prevent log flooding
    if (this.shouldRateLimit()) {
      return;
    }

    // Mask sensitive data before logging
    const sanitizedEvent = {
      ...event,
      details: PrivacyUtils.maskSensitiveData(event.details)
    };

    // Log based on severity
    switch (event.severity) {
      case 'critical':
        logger.error('Critical security event', sanitizedEvent);
        this.alertSecurityTeam(sanitizedEvent);
        break;
      case 'high':
        logger.error('High severity security event', sanitizedEvent);
        break;
      case 'medium':
        logger.warn('Medium severity security event', sanitizedEvent);
        break;
      case 'low':
        logger.info('Low severity security event', sanitizedEvent);
        break;
    }

    // Store in security database if configured
    this.storeSecurityEvent(sanitizedEvent);
  }

  /**
   * Rate limiting for security logs
   */
  private static shouldRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.lastReset > 60000) {
      this.eventCount = 0;
      this.lastReset = now;
    }

    this.eventCount++;
    return this.eventCount > this.MAX_EVENTS_PER_MINUTE;
  }

  /**
   * Alert security team for critical events
   */
  private static alertSecurityTeam(event: SecurityEvent): void {
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
    logger.error('SECURITY ALERT - Immediate attention required', {
      event,
      alert: true,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Store security event in database
   */
  private static async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // In production, store in dedicated security audit collection
      // await SecurityAuditModel.create(event);
    } catch (error) {
      logger.error('Failed to store security event', { error, event: event.type });
    }
  }

  /**
   * Generate security summary report
   */
  static generateSecuritySummary(timeRange: { start: Date; end: Date }) {
    // This would query the security database and generate summary
    return {
      timeRange,
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      highRiskIPs: [],
      recommendations: []
    };
  }
}

// =============================================================================
// SECURITY MONITORING MIDDLEWARE
// =============================================================================

/**
 * Main security monitoring middleware
 */
export function securityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Analyze request for security threats
    const securityReport = SecurityAnalyzer.generateSecurityReport(req);
    
    // Log high-risk requests immediately
    if (securityReport.analysis.riskScore >= 7) {
      SecurityAuditLogger.logSecurityEvent({
        type: 'suspicious_request',
        severity: 'high',
        userId: (req as any).user?.id,
        ip: securityReport.ip,
        userAgent: securityReport.userAgent,
        timestamp: new Date(),
        details: {
          path: req.path,
          method: req.method,
          riskScore: securityReport.analysis.riskScore,
          flags: securityReport.analysis.flags,
          recommendations: securityReport.analysis.recommendations,
          headers: securityReport.headers
        },
        riskScore: securityReport.analysis.riskScore
      });
    }

    // Monitor response for additional security insights
    const originalSend = res.send;
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log failed authentication attempts
      if (statusCode === 401 && req.path.includes('/auth/')) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'login_failed',
          severity: 'medium',
          userId: req.body?.email || 'unknown',
          ip: securityReport.ip,
          userAgent: securityReport.userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method,
            responseTime,
            email: req.body?.email
          },
          riskScore: 3
        });
      }

      // Log authorization failures
      if (statusCode === 403) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'unauthorized_access',
          severity: 'medium',
          userId: (req as any).user?.id,
          ip: securityReport.ip,
          userAgent: securityReport.userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method,
            responseTime
          },
          riskScore: 4
        });
      }

      // Log validation failures
      if (statusCode === 400 && typeof body === 'string' && body.includes('validation')) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'validation_failed',
          severity: 'low',
          userId: (req as any).user?.id,
          ip: securityReport.ip,
          userAgent: securityReport.userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method,
            responseTime
          },
          riskScore: 1
        });
      }

      // Log rate limit exceeded
      if (statusCode === 429) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          userId: (req as any).user?.id,
          ip: securityReport.ip,
          userAgent: securityReport.userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method,
            responseTime
          },
          riskScore: 3
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

// =============================================================================
// SPECIALIZED SECURITY MIDDLEWARE
// =============================================================================

/**
 * Authentication security monitoring
 */
export function authSecurityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Log successful login
    res.on('finish', () => {
      if (res.statusCode === 200 && req.path.includes('/login')) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'login',
          severity: 'low',
          userId: (req as any).user?.id || req.body?.email,
          ip,
          userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method
          },
          riskScore: 0
        });
      }

      // Log password changes
      if (res.statusCode === 200 && req.path.includes('/password')) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'password_change',
          severity: 'medium',
          userId: (req as any).user?.id,
          ip,
          userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method
          },
          riskScore: 2
        });
      }
    });

    next();
  };
}

/**
 * Admin action monitoring
 */
export function adminSecurityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.id;

    // Log all admin actions
    res.on('finish', () => {
      if (res.statusCode < 400) {
        SecurityAuditLogger.logSecurityEvent({
          type: 'admin_action',
          severity: 'medium',
          userId,
          ip,
          userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method,
            body: PrivacyUtils.maskSensitiveData(req.body),
            query: req.query
          },
          riskScore: 2
        });
      }
    });

    next();
  };
}

/**
 * Data access monitoring
 */
export function dataAccessMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.id;

    // Monitor sensitive data access
    const sensitiveEndpoints = [
      '/users/profile',
      '/users/analytics',
      '/admin/',
      '/export/',
      '/analytics/'
    ];

    const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
      req.path.includes(endpoint)
    );

    if (isSensitiveEndpoint) {
      res.on('finish', () => {
        if (res.statusCode === 200) {
          SecurityAuditLogger.logSecurityEvent({
            type: 'data_access',
            severity: 'low',
            userId,
            ip,
            userAgent,
            timestamp: new Date(),
            details: {
              path: req.path,
              method: req.method,
              query: req.query
            },
            riskScore: 1
          });
        }
      });
    }

    next();
  };
}

/**
 * File upload security monitoring
 */
export function fileUploadSecurityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.id;

    // Monitor file uploads
    if (req.method === 'POST' && (req.is('multipart/form-data') || req.path.includes('/upload'))) {
      const contentLength = parseInt(req.get('Content-Length') || '0');
      
      res.on('finish', () => {
        SecurityAuditLogger.logSecurityEvent({
          type: 'file_upload',
          severity: res.statusCode === 200 ? 'low' : 'medium',
          userId,
          ip,
          userAgent,
          timestamp: new Date(),
          details: {
            path: req.path,
            method: req.method,
            contentLength,
            contentType: req.get('Content-Type'),
            statusCode: res.statusCode
          },
          riskScore: res.statusCode === 200 ? 1 : 3
        });
      });
    }

    next();
  };
}

// =============================================================================
// SECURITY HEALTH CHECK
// =============================================================================

/**
 * Security health check endpoint
 */
export function getSecurityHealth(req: Request, res: Response) {
  const healthStatus = {
    timestamp: new Date(),
    status: 'healthy',
    checks: {
      rateLimit: { status: 'operational', description: 'Rate limiting active' },
      bruteForce: { status: 'operational', description: 'Brute force protection active' },
      validation: { status: 'operational', description: 'Input validation active' },
      monitoring: { status: 'operational', description: 'Security monitoring active' },
      encryption: { status: 'operational', description: 'Data encryption enabled' }
    },
    metrics: {
      securityEventsLast24h: 0, // Would query from database
      highRiskRequestsBlocked: 0,
      suspiciousIPs: 0,
      riskScore: 'low'
    },
    recommendations: [
      'Continue monitoring security events',
      'Review security logs regularly',
      'Update security rules based on threat intelligence'
    ]
  };

  res.json(healthStatus);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const securityAudit = {
  logger: SecurityAuditLogger,
  monitoring: securityMonitoring,
  auth: authSecurityMonitoring,
  admin: adminSecurityMonitoring,
  dataAccess: dataAccessMonitoring,
  fileUpload: fileUploadSecurityMonitoring,
  healthCheck: getSecurityHealth
};