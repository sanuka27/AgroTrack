import crypto from 'crypto';
import { Request } from 'express';
import validator from 'validator';
import { logger } from '../config/logger';

/**
 * Security utilities for AgroTrack API
 * Collection of helper functions for various security operations
 */

// =============================================================================
// ENCRYPTION & HASHING UTILITIES
// =============================================================================

export class CryptoUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * Generate cryptographically secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure hash of input data
   */
  static generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Generate HMAC signature
   */
  static generateHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature (timing-safe)
   */
  static verifyHMAC(data: string, signature: string, secret: string, algorithm: string = 'sha256'): boolean {
    const expectedSignature = this.generateHMAC(data, secret, algorithm);
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.warn('HMAC verification failed', { error });
      return false;
    }
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string, key?: string): { encrypted: string; iv: string; tag: string } {
    const encryptionKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(this.KEY_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, encryptionKey);
    cipher.setAAD(Buffer.from('agrotrack', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const encryptionKey = Buffer.from(key, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, encryptionKey);
    decipher.setAAD(Buffer.from('agrotrack', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate secure token for password reset, email verification, etc.
   */
  static generateSecureToken(): { token: string; hash: string; expires: Date } {
    const token = this.generateSecureRandom(32);
    const hash = this.generateHash(token);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return { token, hash, expires };
  }

  /**
   * Verify secure token
   */
  static verifySecureToken(token: string, hash: string, expires: Date): boolean {
    if (new Date() > expires) return false;
    return this.generateHash(token) === hash;
  }
}

// =============================================================================
// REQUEST SECURITY ANALYSIS
// =============================================================================

export class SecurityAnalyzer {
  /**
   * Analyze request for suspicious patterns
   */
  static analyzeRequest(req: Request): {
    riskScore: number;
    flags: string[];
    recommendations: string[];
  } {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check User-Agent
    const userAgent = req.get('User-Agent') || '';
    if (!userAgent) {
      flags.push('missing_user_agent');
      riskScore += 2;
      recommendations.push('Request missing User-Agent header');
    } else if (this.isSuspiciousUserAgent(userAgent)) {
      flags.push('suspicious_user_agent');
      riskScore += 3;
      recommendations.push('Suspicious User-Agent detected');
    }

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/|;)/,
      /(\b(char|nchar|varchar|nvarchar|ascii|unicode)\s*\()/i
    ];

    const allParams = { ...req.query, ...req.body, ...req.params };
    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(value)) {
            flags.push('sql_injection_attempt');
            riskScore += 5;
            recommendations.push(`Potential SQL injection in parameter: ${key}`);
            break;
          }
        }
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /document\.cookie/gi,
      /window\.location/gi
    ];

    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(value)) {
            flags.push('xss_attempt');
            riskScore += 4;
            recommendations.push(`Potential XSS in parameter: ${key}`);
            break;
          }
        }
      }
    }

    // Check request size
    const contentLength = parseInt(req.get('Content-Length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      flags.push('large_request');
      riskScore += 2;
      recommendations.push('Unusually large request body');
    }

    // Check for path traversal
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi
    ];

    const fullUrl = req.originalUrl || req.url;
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(fullUrl)) {
        flags.push('path_traversal_attempt');
        riskScore += 4;
        recommendations.push('Potential path traversal attempt');
        break;
      }
    }

    // Check for command injection
    const commandInjectionPatterns = [
      /[;&|`]/,
      /\$\(/,
      /\${/,
      /\|\|/,
      /&&/
    ];

    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        for (const pattern of commandInjectionPatterns) {
          if (pattern.test(value)) {
            flags.push('command_injection_attempt');
            riskScore += 5;
            recommendations.push(`Potential command injection in parameter: ${key}`);
            break;
          }
        }
      }
    }

    return { riskScore, flags, recommendations };
  }

  /**
   * Check if User-Agent is suspicious
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
      /postman/i,
      /insomnia/i
    ];

    // Allow legitimate search engine bots
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i, // Yahoo
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i
    ];

    // Check if it's a legitimate bot first
    for (const pattern of legitimateBots) {
      if (pattern.test(userAgent)) return false;
    }

    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) return true;
    }

    return false;
  }

  /**
   * Generate security report for request
   */
  static generateSecurityReport(req: Request): {
    timestamp: Date;
    ip: string;
    userAgent: string;
    method: string;
    path: string;
    analysis: ReturnType<typeof SecurityAnalyzer.analyzeRequest>;
    headers: Record<string, any>;
    geoLocation?: any;
  } {
    const analysis = this.analyzeRequest(req);
    
    return {
      timestamp: new Date(),
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      path: req.path,
      analysis,
      headers: {
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP'),
        'referer': req.get('Referer'),
        'origin': req.get('Origin'),
        'host': req.get('Host')
      }
    };
  }
}

// =============================================================================
// DATA MASKING & PRIVACY
// =============================================================================

export class PrivacyUtils {
  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const sensitiveFields = [
      'password', 'pwd', 'secret', 'token', 'key', 'auth',
      'authorization', 'cookie', 'session', 'csrf',
      'ssn', 'social', 'credit', 'card', 'cvv', 'pin',
      'account', 'bank', 'routing', 'iban',
      'email', 'phone', 'mobile', 'telephone'
    ];

    const masked = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => keyLower.includes(field));

      if (isSensitive && typeof value === 'string') {
        // Mask based on type
        if (keyLower.includes('email')) {
          (masked as any)[key] = this.maskEmail(value);
        } else if (keyLower.includes('phone') || keyLower.includes('mobile')) {
          (masked as any)[key] = this.maskPhone(value);
        } else if (keyLower.includes('card') || keyLower.includes('credit')) {
          (masked as any)[key] = this.maskCreditCard(value);
        } else {
          (masked as any)[key] = this.maskString(value);
        }
      } else if (typeof value === 'object') {
        (masked as any)[key] = this.maskSensitiveData(value);
      } else {
        (masked as any)[key] = value;
      }
    }

    return masked;
  }

  /**
   * Mask email address
   */
  private static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***';
    
    const [username, domain] = email.split('@');
    if (!username) return '***@' + domain;
    
    const maskedUsername = username.length > 2 
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : '*'.repeat(username.length);
    
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask phone number
   */
  private static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  /**
   * Mask credit card number
   */
  private static maskCreditCard(card: string): string {
    if (!card || card.length < 4) return '***';
    
    return '*'.repeat(card.length - 4) + card.slice(-4);
  }

  /**
   * Mask generic string
   */
  private static maskString(str: string): string {
    if (!str) return '***';
    if (str.length <= 3) return '*'.repeat(str.length);
    
    return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
  }

  /**
   * Generate privacy-compliant user identifier
   */
  static generateUserHash(identifier: string): string {
    return CryptoUtils.generateHash(identifier + process.env.HASH_SALT || 'default-salt');
  }
}

// =============================================================================
// IP SECURITY & GEOLOCATION
// =============================================================================

export class IPSecurity {
  private static readonly BLOCKED_IP_RANGES = [
    // Local/Private networks
    /^127\.0\.0\.1$/, // localhost
    /^192\.168\./, // Private Class C
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private Class B
    /^169\.254\./, // Link-local
    /^224\./, // Multicast
    /^255\./, // Broadcast
    
    // Known malicious ranges (example - update with threat intelligence)
    /^185\.220\./, // Tor exit nodes (example)
  ];

  /**
   * Check if IP address is blocked
   */
  static isBlocked(ip: string): boolean {
    return this.BLOCKED_IP_RANGES.some(pattern => pattern.test(ip));
  }

  /**
   * Get real IP address from request (considering proxies)
   */
  static getRealIP(req: Request): string {
    const forwarded = req.get('X-Forwarded-For');
    const realIP = req.get('X-Real-IP');
    const remoteIP = req.connection.remoteAddress || req.ip;

    // X-Forwarded-For can contain multiple IPs, take the first one
    if (forwarded) {
      const ips = forwarded.split(',').map(ip => ip.trim());
      return (ips.length > 0 ? ips[0] : null) || (remoteIP as string) || 'unknown';
    }

    if (realIP) return realIP;
    return remoteIP || 'unknown';
  }

  /**
   * Validate IP address format
   */
  static isValidIP(ip: string): boolean {
    return validator.isIP(ip);
  }

  /**
   * Check if IP is from a VPN/Proxy (basic check)
   */
  static isPotentialVPN(ip: string): boolean {
    // This is a basic implementation
    // In production, you might want to use a service like IPQualityScore
    const vpnRanges = [
      /^185\.220\./, // Tor
      /^199\.87\.154\./, // NordVPN (example)
      // Add more VPN/proxy ranges as needed
    ];

    return vpnRanges.some(pattern => pattern.test(ip));
  }
}

// =============================================================================
// SESSION SECURITY
// =============================================================================

export class SessionSecurity {
  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return CryptoUtils.generateSecureRandom(32);
  }

  /**
   * Validate session configuration
   */
  static getSecureSessionConfig() {
    return {
      name: 'agrotrack.sid',
      secret: process.env.SESSION_SECRET || CryptoUtils.generateSecureRandom(32),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' as const // CSRF protection
      },
      genid: this.generateSessionId
    };
  }

  /**
   * Session fingerprinting for additional security
   */
  static generateFingerprint(req: Request): string {
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      IPSecurity.getRealIP(req)
    ];

    return CryptoUtils.generateHash(components.join('|'));
  }

  /**
   * Validate session fingerprint
   */
  static validateFingerprint(req: Request, storedFingerprint: string): boolean {
    const currentFingerprint = this.generateFingerprint(req);
    return currentFingerprint === storedFingerprint;
  }
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export const SecurityUtils = {
  crypto: CryptoUtils,
  analyzer: SecurityAnalyzer,
  privacy: PrivacyUtils,
  ip: IPSecurity,
  session: SessionSecurity
};

export default SecurityUtils;