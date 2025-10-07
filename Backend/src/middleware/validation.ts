import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';
import { logger } from '../config/logger';

// Common validation patterns
export const ValidationPatterns = {
  objectId: /^[0-9a-fA-F]{24}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  url: /^https?:\/\/.+\..+/,
  base64Image: /^data:image\/(png|jpg|jpeg|gif|webp);base64,/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  semver: /^\d+\.\d+\.\d+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Sanitization options
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: {
    'a': ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard' as const,
  selfClosing: ['br']
};

// XSS sanitization for strict mode
const strictSanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard' as const
};

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
}

export class DataValidator {
  // Basic data type validation
  static validateString(value: any, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    trim?: boolean;
    sanitize?: boolean;
    strictSanitize?: boolean;
  } = {}): ValidationResult {
    const errors: ValidationError[] = [];
    let sanitizedValue = value;

    // Check if required
    if (options.required && (!value || value === '')) {
      errors.push({ field: 'value', message: 'Field is required' });
      return { isValid: false, errors };
    }

    // Skip validation if optional and empty
    if (!options.required && (!value || value === '')) {
      return { isValid: true, errors: [], sanitizedData: '' };
    }

    // Type check
    if (typeof value !== 'string') {
      errors.push({ field: 'value', message: 'Must be a string', value });
      return { isValid: false, errors };
    }

    // Trim if requested
    if (options.trim) {
      sanitizedValue = value.trim();
    }

    // Sanitize HTML
    if (options.sanitize) {
      const sanitizeOpts = options.strictSanitize ? strictSanitizeOptions : sanitizeOptions;
      sanitizedValue = sanitizeHtml(sanitizedValue, sanitizeOpts);
    }

    // Length validation
    if (options.minLength && sanitizedValue.length < options.minLength) {
      errors.push({ 
        field: 'value', 
        message: `Must be at least ${options.minLength} characters long`,
        value: sanitizedValue
      });
    }

    if (options.maxLength && sanitizedValue.length > options.maxLength) {
      errors.push({ 
        field: 'value', 
        message: `Must be no more than ${options.maxLength} characters long`,
        value: sanitizedValue
      });
    }

    // Pattern validation
    if (options.pattern && !options.pattern.test(sanitizedValue)) {
      errors.push({ 
        field: 'value', 
        message: 'Invalid format',
        value: sanitizedValue
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedValue
    };
  }

  static validateNumber(value: any, options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if required
    if (options.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: 'value', message: 'Field is required' });
      return { isValid: false, errors };
    }

    // Skip validation if optional and empty
    if (!options.required && (value === undefined || value === null || value === '')) {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    // Convert to number
    const numValue = Number(value);

    // Type check
    if (isNaN(numValue)) {
      errors.push({ field: 'value', message: 'Must be a valid number', value });
      return { isValid: false, errors };
    }

    // Integer check
    if (options.integer && !Number.isInteger(numValue)) {
      errors.push({ field: 'value', message: 'Must be an integer', value: numValue });
    }

    // Positive check
    if (options.positive && numValue <= 0) {
      errors.push({ field: 'value', message: 'Must be a positive number', value: numValue });
    }

    // Range validation
    if (options.min !== undefined && numValue < options.min) {
      errors.push({ 
        field: 'value', 
        message: `Must be at least ${options.min}`,
        value: numValue
      });
    }

    if (options.max !== undefined && numValue > options.max) {
      errors.push({ 
        field: 'value', 
        message: `Must be no more than ${options.max}`,
        value: numValue
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: numValue
    };
  }

  static validateEmail(email: any, required: boolean = true): ValidationResult {
    return this.validateString(email, {
      required,
      pattern: ValidationPatterns.email,
      trim: true,
      maxLength: 255,
      sanitize: true,
      strictSanitize: true
    });
  }

  static validateObjectId(id: any, required: boolean = true): ValidationResult {
    return this.validateString(id, {
      required,
      pattern: ValidationPatterns.objectId,
      trim: true
    });
  }

  static validateUrl(url: any, required: boolean = true): ValidationResult {
    return this.validateString(url, {
      required,
      pattern: ValidationPatterns.url,
      trim: true,
      maxLength: 2083,
      sanitize: true,
      strictSanitize: true
    });
  }

  static validatePassword(password: any, strongValidation: boolean = true): ValidationResult {
    const options: any = {
      required: true,
      minLength: strongValidation ? 8 : 6,
      maxLength: 128
    };

    if (strongValidation) {
      options.pattern = ValidationPatterns.strongPassword;
    }

    return this.validateString(password, options);
  }

  static validateArray(value: any, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: any, index: number) => ValidationResult;
  } = {}): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if required
    if (options.required && (!value || !Array.isArray(value))) {
      errors.push({ field: 'value', message: 'Field is required and must be an array' });
      return { isValid: false, errors };
    }

    // Skip validation if optional and empty
    if (!options.required && (!value || !Array.isArray(value))) {
      return { isValid: true, errors: [], sanitizedData: [] };
    }

    // Type check
    if (!Array.isArray(value)) {
      errors.push({ field: 'value', message: 'Must be an array', value });
      return { isValid: false, errors };
    }

    // Length validation
    if (options.minLength && value.length < options.minLength) {
      errors.push({ 
        field: 'value', 
        message: `Array must contain at least ${options.minLength} items`,
        value: value.length
      });
    }

    if (options.maxLength && value.length > options.maxLength) {
      errors.push({ 
        field: 'value', 
        message: `Array must contain no more than ${options.maxLength} items`,
        value: value.length
      });
    }

    // Item validation
    const sanitizedArray: any[] = [];
    if (options.itemValidator) {
      value.forEach((item, index) => {
        const itemResult = options.itemValidator!(item, index);
        if (!itemResult.isValid) {
          itemResult.errors.forEach(error => {
            errors.push({
              ...error,
              field: `[${index}].${error.field}`
            });
          });
        } else {
          sanitizedArray.push(itemResult.sanitizedData !== undefined ? itemResult.sanitizedData : item);
        }
      });
    } else {
      sanitizedArray.push(...value);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedArray
    };
  }

  static validateObject(value: any, schema: Record<string, (value: any) => ValidationResult>, options: {
    required?: boolean;
    allowUnknown?: boolean;
  } = {}): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if required
    if (options.required && (!value || typeof value !== 'object')) {
      errors.push({ field: 'value', message: 'Field is required and must be an object' });
      return { isValid: false, errors };
    }

    // Skip validation if optional and empty
    if (!options.required && (!value || typeof value !== 'object')) {
      return { isValid: true, errors: [], sanitizedData: {} };
    }

    // Type check
    if (typeof value !== 'object' || Array.isArray(value)) {
      errors.push({ field: 'value', message: 'Must be an object', value });
      return { isValid: false, errors };
    }

    const sanitizedObject: any = {};

    // Validate known fields
    Object.keys(schema).forEach(key => {
      const validator = schema[key];
      if (validator) {
        const fieldResult = validator(value[key]);
        if (!fieldResult.isValid) {
          fieldResult.errors.forEach(error => {
            errors.push({
              ...error,
              field: key
            });
          });
        } else {
          sanitizedObject[key] = fieldResult.sanitizedData !== undefined ? fieldResult.sanitizedData : value[key];
        }
      }
    });

    // Handle unknown fields
    if (!options.allowUnknown) {
      Object.keys(value).forEach(key => {
        if (!schema[key]) {
          errors.push({
            field: key,
            message: 'Unknown field',
            value: value[key]
          });
        }
      });
    } else {
      // Include unknown fields in sanitized data
      Object.keys(value).forEach(key => {
        if (!schema[key]) {
          sanitizedObject[key] = value[key];
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedObject
    };
  }

  static validateDate(value: any, options: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    futureOnly?: boolean;
    pastOnly?: boolean;
  } = {}): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if required
    if (options.required && (!value || value === '')) {
      errors.push({ field: 'value', message: 'Field is required' });
      return { isValid: false, errors };
    }

    // Skip validation if optional and empty
    if (!options.required && (!value || value === '')) {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    // Convert to Date
    const dateValue = new Date(value);

    // Type check
    if (isNaN(dateValue.getTime())) {
      errors.push({ field: 'value', message: 'Must be a valid date', value });
      return { isValid: false, errors };
    }

    const now = new Date();

    // Future/Past validation
    if (options.futureOnly && dateValue <= now) {
      errors.push({ field: 'value', message: 'Date must be in the future', value: dateValue });
    }

    if (options.pastOnly && dateValue >= now) {
      errors.push({ field: 'value', message: 'Date must be in the past', value: dateValue });
    }

    // Range validation
    if (options.minDate && dateValue < options.minDate) {
      errors.push({ 
        field: 'value', 
        message: `Date must be after ${options.minDate.toISOString()}`,
        value: dateValue
      });
    }

    if (options.maxDate && dateValue > options.maxDate) {
      errors.push({ 
        field: 'value', 
        message: `Date must be before ${options.maxDate.toISOString()}`,
        value: dateValue
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: dateValue
    };
  }
}

// Joi schema builders for complex validation
export class SchemaBuilder {
  static createUserSchema() {
    return Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().email().lowercase().trim().required(),
      password: Joi.string().min(8).pattern(ValidationPatterns.strongPassword).required(),
      avatar: Joi.string().uri().optional(),
      bio: Joi.string().max(500).optional(),
      location: Joi.string().max(100).optional(),
      timezone: Joi.string().max(50).optional(),
      language: Joi.string().length(2).optional(),
      theme: Joi.string().valid('light', 'dark', 'auto').optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        reminders: Joi.boolean().optional(),
        community: Joi.boolean().optional(),
        marketing: Joi.boolean().optional()
      }).optional()
    });
  }

  static createPlantSchema() {
    return Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      species: Joi.string().trim().min(1).max(150).required(),
      variety: Joi.string().trim().max(100).optional(),
      description: Joi.string().max(1000).optional(),
      image: Joi.string().uri().optional(),
      location: Joi.string().max(100).optional(),
      acquiredDate: Joi.date().max('now').optional(),
      category: Joi.string().valid('houseplant', 'garden', 'herb', 'succulent', 'tree', 'flower', 'vegetable', 'fruit').optional(),
      healthStatus: Joi.string().valid('healthy', 'warning', 'critical', 'recovering').default('healthy'),
      careInstructions: Joi.object({
        watering: Joi.object({
          frequency: Joi.number().min(1).max(365).optional(),
          amount: Joi.string().max(50).optional(),
          notes: Joi.string().max(500).optional()
        }).optional(),
        fertilizing: Joi.object({
          frequency: Joi.number().min(1).max(365).optional(),
          type: Joi.string().max(100).optional(),
          season: Joi.string().max(50).optional(),
          notes: Joi.string().max(500).optional()
        }).optional(),
        temperature: Joi.object({
          min: Joi.number().min(-50).max(60).optional(),
          max: Joi.number().min(-50).max(60).optional(),
          optimal: Joi.number().min(-50).max(60).optional(),
          notes: Joi.string().max(500).optional()
        }).optional(),
        humidity: Joi.object({
          min: Joi.number().min(0).max(100).optional(),
          max: Joi.number().min(0).max(100).optional(),
          optimal: Joi.number().min(0).max(100).optional(),
          notes: Joi.string().max(500).optional()
        }).optional(),
        light: Joi.object({
          type: Joi.string().valid('low', 'medium', 'bright', 'direct').optional(),
          hours: Joi.number().min(0).max(24).optional(),
          notes: Joi.string().max(500).optional()
        }).optional(),
        soil: Joi.object({
          type: Joi.string().max(100).optional(),
          ph: Joi.number().min(0).max(14).optional(),
          drainage: Joi.string().valid('poor', 'moderate', 'good', 'excellent').optional(),
          notes: Joi.string().max(500).optional()
        }).optional()
      }).optional(),
      tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
      isPublic: Joi.boolean().default(false),
      customFields: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean())).optional()
    });
  }

  static createCareLogSchema() {
    return Joi.object({
      plantId: Joi.string().pattern(ValidationPatterns.objectId).required(),
      type: Joi.string().valid('watering', 'fertilizing', 'pruning', 'repotting', 'pest_treatment', 'disease_treatment', 'observation', 'other').required(),
      date: Joi.date().max('now').required(),
      notes: Joi.string().max(1000).optional(),
      images: Joi.array().items(Joi.string().uri()).max(5).optional(),
      measurements: Joi.object({
        height: Joi.number().min(0).max(10000).optional(),
        width: Joi.number().min(0).max(10000).optional(),
        leaves: Joi.number().min(0).max(10000).optional(),
        flowers: Joi.number().min(0).max(1000).optional(),
        fruits: Joi.number().min(0).max(1000).optional()
      }).optional(),
      healthAssessment: Joi.object({
        overall: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'critical').optional(),
        leaves: Joi.string().valid('healthy', 'yellowing', 'browning', 'wilting', 'spots', 'holes').optional(),
        stem: Joi.string().valid('healthy', 'weak', 'damaged', 'rotting').optional(),
        roots: Joi.string().valid('healthy', 'bound', 'rotting', 'dry').optional(),
        pests: Joi.boolean().optional(),
        diseases: Joi.boolean().optional()
      }).optional(),
      weather: Joi.object({
        temperature: Joi.number().min(-50).max(60).optional(),
        humidity: Joi.number().min(0).max(100).optional(),
        rainfall: Joi.number().min(0).max(500).optional(),
        sunshine: Joi.number().min(0).max(24).optional()
      }).optional(),
      tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional()
    });
  }

  static createReminderSchema() {
    return Joi.object({
      plantId: Joi.string().pattern(ValidationPatterns.objectId).required(),
      title: Joi.string().trim().min(1).max(200).required(),
      description: Joi.string().max(1000).optional(),
      type: Joi.string().valid('watering', 'fertilizing', 'pruning', 'repotting', 'pest_check', 'general').required(),
      scheduledDate: Joi.date().min('now').required(),
      frequency: Joi.string().valid('once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom').default('once'),
      customFrequency: Joi.when('frequency', {
        is: 'custom',
        then: Joi.object({
          value: Joi.number().min(1).max(365).required(),
          unit: Joi.string().valid('days', 'weeks', 'months', 'years').required()
        }).required(),
        otherwise: Joi.optional()
      }),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        push: Joi.boolean().default(true),
        sms: Joi.boolean().default(false),
        advanceTime: Joi.number().min(0).max(10080).default(60) // minutes
      }).optional(),
      weatherAdjustment: Joi.boolean().default(false),
      tags: Joi.array().items(Joi.string().trim().max(50)).max(5).optional(),
      isActive: Joi.boolean().default(true)
    });
  }

  static createCommunityPostSchema() {
    return Joi.object({
      title: Joi.string().trim().min(5).max(200).required(),
      content: Joi.string().min(10).max(5000).required(),
      type: Joi.string().valid('question', 'tip', 'showcase', 'discussion', 'help').default('discussion'),
      category: Joi.string().valid('general', 'watering', 'fertilizing', 'pest_control', 'disease', 'pruning', 'repotting', 'identification').optional(),
      images: Joi.array().items(Joi.string().uri()).max(10).optional(),
      tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
      plantId: Joi.string().pattern(ValidationPatterns.objectId).optional(),
      isPublic: Joi.boolean().default(true),
      allowComments: Joi.boolean().default(true),
      location: Joi.string().max(100).optional(),
      difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
      estimatedTime: Joi.number().min(1).max(10080).optional() // minutes
    });
  }
}

// Express middleware for validation
export function validateRequest(schema: Joi.ObjectSchema, options: {
  source?: 'body' | 'query' | 'params';
  abortEarly?: boolean;
  stripUnknown?: boolean;
  allowUnknown?: boolean;
} = {}) {
  const { source = 'body', abortEarly = false, stripUnknown = true, allowUnknown = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly,
      stripUnknown,
      allowUnknown,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        code: detail.type
      }));

      logger.warn('Validation failed:', {
        source,
        errors: validationErrors,
        data
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Replace the original data with validated/sanitized data
    req[source] = value;
    next();
    return;
  };
}

// Custom validation middleware
export function validateCustom(validator: (data: any) => ValidationResult, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const result = validator(data);

    if (!result.isValid) {
      logger.warn('Custom validation failed:', {
        source,
        errors: result.errors,
        data
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors
      });
    }

    // Replace with sanitized data if available
    if (result.sanitizedData !== undefined) {
      req[source] = result.sanitizedData;
    }

    next();
    return;
  };
}

export default {
  DataValidator,
  SchemaBuilder,
  ValidationPatterns,
  validateRequest,
  validateCustom
};