import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../config/logger';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors for better response structure
    const formattedErrors: { [key: string]: string } = {};
    
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        formattedErrors[error.path] = error.msg;
      }
    });

    // Log validation errors
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: formattedErrors,
      body: req.body,
      ip: req.ip
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
    return;
  }

  next();
};