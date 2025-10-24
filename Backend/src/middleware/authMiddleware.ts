import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { CustomError } from './errorMiddleware';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await protect(req, res, next);
};

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      console.log('No token in request headers');
      const error = new Error('Not authorized, no token') as CustomError;
      error.statusCode = 401;
      return next(error);
    }

    try {
      // Ensure secret is configured
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.log('JWT_SECRET not configured');
        const cfgError = new Error('Server misconfiguration: JWT_SECRET not set') as CustomError;
        cfgError.statusCode = 500;
        return next(cfgError);
      }

      // Verify token - the payload uses 'id' not 'userId'
      const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };
      console.log('Token decoded successfully:', { id: decoded.id, email: decoded.email });

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('User not found for id:', decoded.id);
        const error = new Error('Not authorized, user not found') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      console.log('User found:', user._id);
      req.user = user;
      next();
    } catch (error) {
      console.log('Token verification failed:', error);
      const authError = new Error('Not authorized, token failed') as CustomError;
      authError.statusCode = 401;
      return next(authError);
    }
  } catch (error) {
    next(error);
  }
};

// Optional authentication - allows guest users
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue as guest user
    if (!token) {
      req.user = null;
      return next();
    }


      try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          // If secret missing, treat as server error and continue as guest to avoid breaking flows in some environments
          req.user = null;
          return next();
        }

  // Verify token (payload uses `id` like in protect)
  const decoded = jwt.verify(token, secret) as { id: string };

  // Get user from database
  const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // Invalid token, but continue as guest
        req.user = null;
        return next();
      }

      req.user = user;
      next();
    } catch (error) {
      // Invalid token, but continue as guest
      req.user = null;
      next();
    }
  } catch (error) {
    next(error);
  }
};

// Authorize user roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error = new Error('User not authenticated') as CustomError;
      error.statusCode = 401;
      return next(error);
    }

    const user = req.user as any as IUser;
    if (!roles.includes(user.role)) {
      const error = new Error(
        `User role ${user.role} is not authorized to access this route`
      ) as CustomError;
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};