import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Define allowed roles type
export type UserRole = 'guest' | 'user' | 'moderator' | 'admin' | 'super_admin';

/**
 * Role-based access control middleware
 * Checks if the authenticated user has one of the required roles
 */
export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated (should be done by authMiddleware first)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const userRole = req.user.role as UserRole;

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        logger.warn(`Access denied for user ${req.user.id} with role ${userRole} to endpoint ${req.path}`, {
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles,
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        });

        res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          details: {
            required: allowedRoles,
            current: userRole
          }
        });
        return;
      }

      // User has required role, proceed to next middleware
      logger.info(`Access granted for user ${req.user.id} with role ${userRole} to endpoint ${req.path}`, {
        userId: req.user.id,
        userRole,
        endpoint: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Role guard middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during role verification'
      });
    }
  };
};

/**
 * Admin-only access middleware
 * Shorthand for roleGuard(['admin'])
 */
export const adminOnly = roleGuard(['admin']);

/**
 * User and admin access middleware
 * Shorthand for roleGuard(['user', 'admin'])
 */
export const userAndAdmin = roleGuard(['user', 'admin']);

/**
 * All authenticated users (guest, user, admin)
 * Shorthand for roleGuard(['guest', 'user', 'admin'])
 */
export const authenticatedUsers = roleGuard(['guest', 'user', 'admin']);

/**
 * Check if user has specific role
 */
export const hasRole = (user: any, role: UserRole): boolean => {
  return user && user.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: any, roles: UserRole[]): boolean => {
  return user && roles.includes(user.role);
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: any): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Check if user is at least a regular user (not guest)
 */
export const isVerifiedUser = (user: any): boolean => {
  return hasAnyRole(user, ['user', 'admin']);
};

/**
 * Alias for roleGuard to match expected import
 */
export const requireRole = roleGuard;