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
      const error = new Error('Not authorized, no token') as CustomError;
      error.statusCode = 401;
      return next(error);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { userId: string };
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        const error = new Error('Not authorized, user not found') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      req.user = user;
      next();
    } catch (error) {
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
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { userId: string };

      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');

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