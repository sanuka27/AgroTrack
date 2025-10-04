import { Request, Response, NextFunction } from 'express';
import { DataValidator, ValidationResult } from './validation';
import logger from '../config/logger';

// Advanced validation utilities
export class AdvancedValidator {
  // File validation
  static validateFile(file: any, options: {
    required?: boolean;
    maxSize?: number; // in bytes
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
  } = {}): ValidationResult {
    const errors: any[] = [];

    if (options.required && !file) {
      errors.push({ field: 'file', message: 'File is required' });
      return { isValid: false, errors };
    }

    if (!file) {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    // Size validation
    if (options.maxSize && file.size > options.maxSize) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`,
        value: file.size
      });
    }

    // MIME type validation
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      errors.push({
        field: 'file',
        message: `File type not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
        value: file.mimetype
      });
    }

    // Extension validation
    if (options.allowedExtensions) {
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push({
          field: 'file',
          message: `File extension not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`,
          value: extension
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: file
    };
  }

  // Image validation
  static validateImage(file: any, options: {
    required?: boolean;
    maxSize?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    aspectRatio?: number;
    allowedFormats?: string[];
  } = {}): ValidationResult {
    const baseValidation = this.validateFile(file, {
      required: options.required,
      maxSize: options.maxSize,
      allowedMimeTypes: options.allowedFormats || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    });

    if (!baseValidation.isValid || !file) {
      return baseValidation;
    }

    // Additional image-specific validations would require image processing
    // For now, return the base validation
    return baseValidation;
  }

  // Conditional validation
  static validateConditional(
    value: any,
    condition: (data: any) => boolean,
    validator: (value: any) => ValidationResult,
    data: any
  ): ValidationResult {
    if (!condition(data)) {
      return { isValid: true, errors: [], sanitizedData: value };
    }

    return validator(value);
  }

  // Cross-field validation
  static validateCrossField(
    data: any,
    rules: Array<{
      fields: string[];
      validator: (values: any[]) => ValidationResult;
      message?: string;
    }>
  ): ValidationResult {
    const errors: any[] = [];

    rules.forEach(rule => {
      const values = rule.fields.map(field => data[field]);
      const result = rule.validator(values);

      if (!result.isValid) {
        result.errors.forEach(error => {
          errors.push({
            ...error,
            field: rule.fields.join(','),
            message: rule.message || error.message
          });
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: data
    };
  }

  // Async validation (for database checks)
  static async validateAsync(
    value: any,
    validator: (value: any) => Promise<ValidationResult>
  ): Promise<ValidationResult> {
    try {
      return await validator(value);
    } catch (error) {
      logger.error('Async validation error:', error);
      return {
        isValid: false,
        errors: [{
          field: 'value',
          message: 'Validation failed due to internal error'
        }]
      };
    }
  }

  // Bulk validation
  static validateBulk(
    items: any[],
    validator: (item: any, index: number) => ValidationResult,
    options: {
      stopOnFirstError?: boolean;
      maxErrors?: number;
    } = {}
  ): ValidationResult {
    const errors: any[] = [];
    const sanitizedItems: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = validator(items[i], i);

      if (!result.isValid) {
        result.errors.forEach(error => {
          errors.push({
            ...error,
            field: `[${i}].${error.field}`,
            index: i
          });
        });

        if (options.stopOnFirstError) {
          break;
        }

        if (options.maxErrors && errors.length >= options.maxErrors) {
          break;
        }
      } else {
        sanitizedItems.push(result.sanitizedData !== undefined ? result.sanitizedData : items[i]);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedItems
    };
  }
}

// Common validation patterns for AgroTrack
export class AgroTrackValidators {
  // Plant name validation
  static validatePlantName(name: any): ValidationResult {
    return DataValidator.validateString(name, {
      required: true,
      minLength: 1,
      maxLength: 100,
      trim: true,
      sanitize: true,
      strictSanitize: true
    });
  }

  // Plant species validation
  static validatePlantSpecies(species: any): ValidationResult {
    return DataValidator.validateString(species, {
      required: true,
      minLength: 1,
      maxLength: 150,
      trim: true,
      sanitize: true,
      strictSanitize: true
    });
  }

  // Care instruction validation
  static validateCareInstruction(instruction: any): ValidationResult {
    if (!instruction || typeof instruction !== 'object') {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    return DataValidator.validateObject(instruction, {
      frequency: (value) => DataValidator.validateNumber(value, { min: 1, max: 365 }),
      amount: (value) => DataValidator.validateString(value, { maxLength: 50, trim: true }),
      notes: (value) => DataValidator.validateString(value, { maxLength: 500, sanitize: true }),
      type: (value) => DataValidator.validateString(value, { maxLength: 100, trim: true })
    });
  }

  // Temperature range validation
  static validateTemperatureRange(temp: any): ValidationResult {
    if (!temp || typeof temp !== 'object') {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    const result = DataValidator.validateObject(temp, {
      min: (value) => DataValidator.validateNumber(value, { min: -50, max: 60 }),
      max: (value) => DataValidator.validateNumber(value, { min: -50, max: 60 }),
      optimal: (value) => DataValidator.validateNumber(value, { min: -50, max: 60 })
    });

    if (!result.isValid) {
      return result;
    }

    // Cross-field validation: min <= optimal <= max
    const data = result.sanitizedData;
    if (data && data.min !== undefined && data.max !== undefined && data.min > data.max) {
      return {
        isValid: false,
        errors: [{
          field: 'min,max',
          message: 'Minimum temperature must be less than or equal to maximum temperature'
        }]
      };
    }

    if (data && data.optimal !== undefined) {
      if (data.min !== undefined && data.optimal < data.min) {
        return {
          isValid: false,
          errors: [{
            field: 'optimal',
            message: 'Optimal temperature must be greater than or equal to minimum temperature'
          }]
        };
      }

      if (data.max !== undefined && data.optimal > data.max) {
        return {
          isValid: false,
          errors: [{
            field: 'optimal',
            message: 'Optimal temperature must be less than or equal to maximum temperature'
          }]
        };
      }
    }

    return result;
  }

  // Reminder frequency validation
  static validateReminderFrequency(frequency: any, customFrequency: any): ValidationResult {
    const errors: any[] = [];

    // Validate frequency enum
    const frequencyResult = DataValidator.validateString(frequency, { required: true });
    if (!frequencyResult.isValid) {
      errors.push(...frequencyResult.errors);
    } else {
      const validFrequencies = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'];
      if (!validFrequencies.includes(frequencyResult.sanitizedData)) {
        errors.push({
          field: 'frequency',
          message: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`,
          value: frequencyResult.sanitizedData
        });
      }

      // Validate custom frequency if frequency is 'custom'
      if (frequencyResult.sanitizedData === 'custom') {
        if (!customFrequency || typeof customFrequency !== 'object') {
          errors.push({
            field: 'customFrequency',
            message: 'Custom frequency is required when frequency is "custom"'
          });
        } else {
          const customResult = DataValidator.validateObject(customFrequency, {
            value: (value) => DataValidator.validateNumber(value, { required: true, min: 1, max: 365, integer: true }),
            unit: (value) => {
              const unitResult = DataValidator.validateString(value, { required: true });
              if (unitResult.isValid) {
                const validUnits = ['days', 'weeks', 'months', 'years'];
                if (!validUnits.includes(unitResult.sanitizedData)) {
                  return {
                    isValid: false,
                    errors: [{
                      field: 'unit',
                      message: `Invalid unit. Must be one of: ${validUnits.join(', ')}`,
                      value: unitResult.sanitizedData
                    }]
                  };
                }
              }
              return unitResult;
            }
          });

          if (!customResult.isValid) {
            customResult.errors.forEach(error => {
              errors.push({
                ...error,
                field: `customFrequency.${error.field}`
              });
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: {
        frequency: frequencyResult.sanitizedData,
        customFrequency: frequency === 'custom' ? customFrequency : undefined
      }
    };
  }

  // Location coordinates validation
  static validateCoordinates(coordinates: any): ValidationResult {
    if (!coordinates || typeof coordinates !== 'object') {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    return DataValidator.validateObject(coordinates, {
      latitude: (value) => DataValidator.validateNumber(value, { required: true, min: -90, max: 90 }),
      longitude: (value) => DataValidator.validateNumber(value, { required: true, min: -180, max: 180 })
    });
  }

  // Plant health status validation
  static validateHealthStatus(status: any): ValidationResult {
    const validStatuses = ['healthy', 'warning', 'critical', 'recovering'];
    const result = DataValidator.validateString(status, { required: false, trim: true });
    
    if (!result.isValid) {
      return result;
    }

    if (result.sanitizedData && !validStatuses.includes(result.sanitizedData)) {
      return {
        isValid: false,
        errors: [{
          field: 'healthStatus',
          message: `Invalid health status. Must be one of: ${validStatuses.join(', ')}`,
          value: result.sanitizedData
        }]
      };
    }

    return result;
  }

  // Tag validation
  static validateTags(tags: any): ValidationResult {
    if (!tags) {
      return { isValid: true, errors: [], sanitizedData: [] };
    }

    return DataValidator.validateArray(tags, {
      maxLength: 20,
      itemValidator: (tag) => DataValidator.validateString(tag, {
        required: true,
        minLength: 1,
        maxLength: 50,
        trim: true,
        sanitize: true,
        strictSanitize: true
      })
    });
  }

  // Image URL validation
  static validateImageUrl(url: any): ValidationResult {
    if (!url) {
      return { isValid: true, errors: [], sanitizedData: null };
    }

    const result = DataValidator.validateUrl(url, false);
    if (!result.isValid) {
      return result;
    }

    // Additional check for image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      result.sanitizedData.toLowerCase().includes(ext)
    );

    if (!hasImageExtension && !result.sanitizedData.startsWith('data:image/')) {
      return {
        isValid: false,
        errors: [{
          field: 'image',
          message: 'URL must point to an image file or be a data URL',
          value: result.sanitizedData
        }]
      };
    }

    return result;
  }
}

// Request validation middleware factory
export function createValidationMiddleware(validations: {
  [key: string]: (value: any, data?: any) => ValidationResult | Promise<ValidationResult>;
}, options: {
  source?: 'body' | 'query' | 'params';
  allowUnknown?: boolean;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { source = 'body', allowUnknown = false } = options;
    const data = req[source];
    const errors: any[] = [];
    const sanitizedData: any = {};

    try {
      // Validate known fields
      for (const [field, validator] of Object.entries(validations)) {
        const result = await validator(data[field], data);
        
        if (!result.isValid) {
          result.errors.forEach(error => {
            errors.push({
              ...error,
              field: field === 'value' ? field : `${field}.${error.field}`
            });
          });
        } else {
          sanitizedData[field] = result.sanitizedData !== undefined ? result.sanitizedData : data[field];
        }
      }

      // Handle unknown fields
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (!validations[key]) {
            if (allowUnknown) {
              sanitizedData[key] = data[key];
            } else {
              errors.push({
                field: key,
                message: 'Unknown field',
                value: data[key]
              });
            }
          }
        });
      }

      if (errors.length > 0) {
        logger.warn('Advanced validation failed:', {
          source,
          errors,
          data
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      // Replace with sanitized data
      req[source] = sanitizedData;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal validation error'
      });
    }
  };
}

export default {
  AdvancedValidator,
  AgroTrackValidators,
  createValidationMiddleware
};