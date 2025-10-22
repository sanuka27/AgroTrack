import Joi from 'joi';
import { ValidationPatterns } from '../middleware/validation';

// Common field schemas
const commonFields = {
  objectId: Joi.string().pattern(ValidationPatterns.objectId),
  email: Joi.string().email().lowercase().trim(),
  password: Joi.string().min(8).pattern(ValidationPatterns.strongPassword),
  url: Joi.string().uri(),
  imageUrl: Joi.string().uri().custom((value, helpers) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      value.toLowerCase().includes(ext)
    );
    
    if (!hasImageExtension && !value.startsWith('data:image/')) {
      return helpers.error('any.invalid');
    }
    
    return value;
  }, 'image URL validation'),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }),
  dateRange: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required()
  }),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    skip: Joi.number().integer().min(0).default(0)
  }),
  sorting: Joi.object({
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc', '1', '-1').default('desc')
  })
};

// Authentication schemas
export const authSchemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: commonFields.email.required(),
    password: commonFields.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match'
    }),
    avatar: commonFields.imageUrl.optional(),
    bio: Joi.string().max(500).optional(),
    location: Joi.string().max(100).optional(),
    timezone: Joi.string().max(50).optional(),
    language: Joi.string().length(2).optional(),
    acceptTerms: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must accept the terms and conditions'
    }),
    marketingEmails: Joi.boolean().default(false)
  }),

  login: Joi.object({
    email: commonFields.email.required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false),
    deviceInfo: Joi.object({
      userAgent: Joi.string().optional(),
      platform: Joi.string().optional(),
      ipAddress: Joi.string().ip().optional()
    }).optional()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: commonFields.email.required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonFields.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonFields.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
  })
};

// User management schemas
export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    bio: Joi.string().max(500).optional(),
    avatar: commonFields.imageUrl.optional(),
    location: Joi.string().max(100).optional(),
    website: commonFields.url.optional(),
    socialLinks: Joi.object({
      instagram: Joi.string().max(100).optional(),
      twitter: Joi.string().max(100).optional(),
      facebook: Joi.string().max(100).optional(),
      youtube: Joi.string().max(100).optional()
    }).optional(),
    privacy: Joi.object({
      profileVisibility: Joi.string().valid('public', 'friends', 'private').default('public'),
      plantsVisibility: Joi.string().valid('public', 'friends', 'private').default('public'),
      showEmail: Joi.boolean().default(false),
      showLocation: Joi.boolean().default(true)
    }).optional()
  }),

  updatePreferences: Joi.object({
  timezone: Joi.string().max(50).optional(),
  language: Joi.string().length(2).optional(),
    dateFormat: Joi.string().valid('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD').optional(),
    temperatureUnit: Joi.string().valid('celsius', 'fahrenheit').optional(),
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      push: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      reminders: Joi.boolean().default(true),
      community: Joi.boolean().default(true),
      marketing: Joi.boolean().default(false),
      digest: Joi.object({
        enabled: Joi.boolean().default(true),
        frequency: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly')
      }).optional()
    }).optional()
  })
};

// Plant management schemas
export const plantSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    species: Joi.string().trim().min(1).max(150).required(),
    variety: Joi.string().trim().max(100).optional(),
    description: Joi.string().max(1000).optional(),
    image: commonFields.imageUrl.optional(),
    images: Joi.array().items(commonFields.imageUrl).max(10).optional(),
    location: Joi.string().max(100).optional(),
    coordinates: commonFields.coordinates.optional(),
    acquiredDate: Joi.date().max('now').optional(),
    category: Joi.string().valid(
      'houseplant', 'garden', 'herb', 'succulent', 'tree', 
      'flower', 'vegetable', 'fruit', 'cactus', 'fern'
    ).optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
    size: Joi.string().valid('small', 'medium', 'large', 'extra-large').optional(),
    maturity: Joi.string().valid('seedling', 'young', 'mature', 'flowering', 'fruiting').optional(),
    healthStatus: Joi.string().valid('healthy', 'warning', 'critical', 'recovering').default('healthy'),
    
    careInstructions: Joi.object({
      watering: Joi.object({
        frequency: Joi.number().min(1).max(365).optional(),
        amount: Joi.string().max(50).optional(),
        method: Joi.string().valid('top', 'bottom', 'misting', 'soaking').optional(),
        waterType: Joi.string().valid('tap', 'filtered', 'distilled', 'rainwater').optional(),
        notes: Joi.string().max(500).optional()
      }).optional(),
      
      fertilizing: Joi.object({
        frequency: Joi.number().min(1).max(365).optional(),
        type: Joi.string().max(100).optional(),
        npkRatio: Joi.string().pattern(/^\d+-\d+-\d+$/).optional(),
        season: Joi.string().valid('spring', 'summer', 'fall', 'winter', 'year-round').optional(),
        dilution: Joi.string().max(50).optional(),
        notes: Joi.string().max(500).optional()
      }).optional(),
      
      light: Joi.object({
        type: Joi.string().valid('low', 'medium', 'bright', 'direct', 'indirect').optional(),
        hours: Joi.number().min(0).max(24).optional(),
        direction: Joi.string().valid('north', 'south', 'east', 'west', 'multiple').optional(),
        artificial: Joi.boolean().optional(),
        notes: Joi.string().max(500).optional()
      }).optional(),
      
      temperature: Joi.object({
        min: Joi.number().min(-50).max(60).optional(),
        max: Joi.number().min(-50).max(60).optional(),
        optimal: Joi.number().min(-50).max(60).optional(),
        tolerance: Joi.string().valid('low', 'medium', 'high').optional(),
        notes: Joi.string().max(500).optional()
      }).optional(),
      
      humidity: Joi.object({
        min: Joi.number().min(0).max(100).optional(),
        max: Joi.number().min(0).max(100).optional(),
        optimal: Joi.number().min(0).max(100).optional(),
        method: Joi.array().items(
          Joi.string().valid('humidifier', 'pebble-tray', 'grouping', 'misting')
        ).optional(),
        notes: Joi.string().max(500).optional()
      }).optional(),
      
      soil: Joi.object({
        type: Joi.string().max(100).optional(),
        ph: Joi.number().min(0).max(14).optional(),
        drainage: Joi.string().valid('poor', 'moderate', 'good', 'excellent').optional(),
        composition: Joi.array().items(Joi.string().max(50)).max(10).optional(),
        repottingFrequency: Joi.number().min(1).max(60).optional(), // months
        notes: Joi.string().max(500).optional()
      }).optional(),
      
      pruning: Joi.object({
        frequency: Joi.string().valid('weekly', 'monthly', 'seasonally', 'yearly', 'as-needed').optional(),
        season: Joi.string().valid('spring', 'summer', 'fall', 'winter', 'any').optional(),
        method: Joi.string().max(100).optional(),
        notes: Joi.string().max(500).optional()
      }).optional()
    }).optional(),
    
    tags: commonFields.tags.optional(),
    isPublic: Joi.boolean().default(false),
    notes: Joi.string().max(2000).optional(),
    source: Joi.object({
      type: Joi.string().valid('nursery', 'gift', 'cutting', 'seed', 'division', 'trade', 'wild', 'other').optional(),
      name: Joi.string().max(100).optional(),
      price: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).optional()
    }).optional(),
    
    customFields: Joi.object().pattern(
      Joi.string().max(50),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.date())
    ).optional()
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    species: Joi.string().trim().min(1).max(150).optional(),
    variety: Joi.string().trim().max(100).optional(),
    description: Joi.string().max(1000).optional(),
    image: commonFields.imageUrl.optional(),
    images: Joi.array().items(commonFields.imageUrl).max(10).optional(),
    location: Joi.string().max(100).optional(),
    coordinates: commonFields.coordinates.optional(),
    acquiredDate: Joi.date().max('now').optional(),
    category: Joi.string().valid(
      'houseplant', 'garden', 'herb', 'succulent', 'tree', 
      'flower', 'vegetable', 'fruit', 'cactus', 'fern'
    ).optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
    size: Joi.string().valid('small', 'medium', 'large', 'extra-large').optional(),
    maturity: Joi.string().valid('seedling', 'young', 'mature', 'flowering', 'fruiting').optional(),
    healthStatus: Joi.string().valid('healthy', 'warning', 'critical', 'recovering').optional(),
    careInstructions: Joi.object().optional(), // Use same structure as create
    tags: commonFields.tags.optional(),
    isPublic: Joi.boolean().optional(),
    notes: Joi.string().max(2000).optional(),
    customFields: Joi.object().pattern(
      Joi.string().max(50),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.date())
    ).optional()
  }),

  search: Joi.object({
    q: Joi.string().trim().max(200).optional(),
    category: Joi.string().valid(
      'houseplant', 'garden', 'herb', 'succulent', 'tree', 
      'flower', 'vegetable', 'fruit', 'cactus', 'fern'
    ).optional(),
    healthStatus: Joi.string().valid('healthy', 'warning', 'critical', 'recovering').optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
    location: Joi.string().max(100).optional(),
    tags: Joi.string().optional(), // comma-separated
    isPublic: Joi.boolean().optional(),
    hasImage: Joi.boolean().optional(),
    acquiredAfter: Joi.date().optional(),
    acquiredBefore: Joi.date().optional(),
    ...commonFields.pagination,
    ...commonFields.sorting
  })
};

// Care log schemas
export const careLogSchemas = {
  create: Joi.object({
    plantId: commonFields.objectId.required(),
    type: Joi.string().valid(
      'watering', 'fertilizing', 'pruning', 'repotting', 'pest_treatment', 
      'disease_treatment', 'observation', 'propagation', 'harvest', 'other'
    ).required(),
    date: Joi.date().max('now').required(),
    title: Joi.string().trim().max(200).optional(),
    notes: Joi.string().max(2000).optional(),
    images: Joi.array().items(commonFields.imageUrl).max(10).optional(),
    
    measurements: Joi.object({
      height: Joi.number().min(0).max(50000).optional(), // mm
      width: Joi.number().min(0).max(50000).optional(), // mm
      diameter: Joi.number().min(0).max(10000).optional(), // mm
      leaves: Joi.number().min(0).max(10000).optional(),
      flowers: Joi.number().min(0).max(1000).optional(),
      fruits: Joi.number().min(0).max(1000).optional(),
      newGrowth: Joi.number().min(0).max(1000).optional()
    }).optional(),
    
    healthAssessment: Joi.object({
      overall: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'critical').optional(),
      leaves: Joi.object({
        condition: Joi.string().valid('healthy', 'yellowing', 'browning', 'wilting', 'spots', 'holes', 'curling').optional(),
        count: Joi.number().min(0).max(10000).optional(),
        newGrowth: Joi.boolean().optional()
      }).optional(),
      stem: Joi.object({
        condition: Joi.string().valid('healthy', 'weak', 'damaged', 'rotting', 'woody').optional(),
        flexibility: Joi.string().valid('flexible', 'firm', 'brittle').optional()
      }).optional(),
      roots: Joi.object({
        condition: Joi.string().valid('healthy', 'bound', 'rotting', 'dry', 'spreading').optional(),
        visible: Joi.boolean().optional()
      }).optional(),
      pests: Joi.object({
        present: Joi.boolean().default(false),
        types: Joi.array().items(Joi.string().max(50)).optional(),
        severity: Joi.string().valid('mild', 'moderate', 'severe').optional()
      }).optional(),
      diseases: Joi.object({
        present: Joi.boolean().default(false),
        types: Joi.array().items(Joi.string().max(50)).optional(),
        severity: Joi.string().valid('mild', 'moderate', 'severe').optional()
      }).optional()
    }).optional(),
    
    environment: Joi.object({
      temperature: Joi.number().min(-50).max(60).optional(),
      humidity: Joi.number().min(0).max(100).optional(),
      lightLevel: Joi.string().valid('low', 'medium', 'bright', 'direct').optional(),
      airFlow: Joi.string().valid('still', 'gentle', 'moderate', 'strong').optional()
    }).optional(),
    
    products: Joi.array().items(Joi.object({
      name: Joi.string().max(100).required(),
      brand: Joi.string().max(50).optional(),
      type: Joi.string().valid('fertilizer', 'pesticide', 'fungicide', 'soil', 'supplement', 'other').optional(),
      amount: Joi.string().max(50).optional(),
      concentration: Joi.string().max(50).optional(),
      notes: Joi.string().max(200).optional()
    })).max(10).optional(),
    
    tags: commonFields.tags.optional(),
    isPublic: Joi.boolean().default(false),
    reminder: Joi.object({
      nextAction: Joi.string().max(200).optional(),
      nextDate: Joi.date().min('now').optional(),
      frequency: Joi.number().min(1).max(365).optional()
    }).optional()
  }),

  update: Joi.object({
    type: Joi.string().valid(
      'watering', 'fertilizing', 'pruning', 'repotting', 'pest_treatment', 
      'disease_treatment', 'observation', 'propagation', 'harvest', 'other'
    ).optional(),
    date: Joi.date().max('now').optional(),
    title: Joi.string().trim().max(200).optional(),
    notes: Joi.string().max(2000).optional(),
    images: Joi.array().items(commonFields.imageUrl).max(10).optional(),
    measurements: Joi.object().optional(), // Use same structure as create
    healthAssessment: Joi.object().optional(), // Use same structure as create
    environment: Joi.object().optional(), // Use same structure as create
    products: Joi.array().items(Joi.object()).max(10).optional(), // Use same structure as create
    tags: commonFields.tags.optional(),
    isPublic: Joi.boolean().optional()
  }),

  search: Joi.object({
    plantId: commonFields.objectId.optional(),
    type: Joi.string().valid(
      'watering', 'fertilizing', 'pruning', 'repotting', 'pest_treatment', 
      'disease_treatment', 'observation', 'propagation', 'harvest', 'other'
    ).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    healthStatus: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'critical').optional(),
    hasImages: Joi.boolean().optional(),
    tags: Joi.string().optional(), // comma-separated
    ...commonFields.pagination,
    ...commonFields.sorting
  })
};

// Reminder schemas
export const reminderSchemas = {
  create: Joi.object({
    plantId: commonFields.objectId.required(),
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid(
      'watering', 'fertilizing', 'pruning', 'repotting', 'pest_check', 
      'disease_check', 'harvest', 'observation', 'general'
    ).required(),
    scheduledDate: Joi.date().min('now').required(),
    frequency: Joi.string().valid(
      'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'
    ).default('once'),
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
    conditions: Joi.object({
      temperature: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().optional()
      }).optional(),
      humidity: Joi.object({
        min: Joi.number().min(0).max(100).optional(),
        max: Joi.number().min(0).max(100).optional()
      }).optional(),
      rainfall: Joi.object({
        min: Joi.number().min(0).optional(),
        max: Joi.number().min(0).optional()
      }).optional()
    }).optional(),
    tags: commonFields.tags.optional(),
    isActive: Joi.boolean().default(true)
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid(
      'watering', 'fertilizing', 'pruning', 'repotting', 'pest_check', 
      'disease_check', 'harvest', 'observation', 'general'
    ).optional(),
    scheduledDate: Joi.date().min('now').optional(),
    frequency: Joi.string().valid(
      'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'
    ).optional(),
    customFrequency: Joi.when('frequency', {
      is: 'custom',
      then: Joi.object({
        value: Joi.number().min(1).max(365).required(),
        unit: Joi.string().valid('days', 'weeks', 'months', 'years').required()
      }).required(),
      otherwise: Joi.optional()
    }),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      advanceTime: Joi.number().min(0).max(10080).optional()
    }).optional(),
    weatherAdjustment: Joi.boolean().optional(),
    conditions: Joi.object({
      temperature: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().optional()
      }).optional(),
      humidity: Joi.object({
        min: Joi.number().min(0).max(100).optional(),
        max: Joi.number().min(0).max(100).optional()
      }).optional(),
      rainfall: Joi.object({
        min: Joi.number().min(0).optional(),
        max: Joi.number().min(0).optional()
      }).optional()
    }).optional(),
    tags: commonFields.tags.optional(),
    isActive: Joi.boolean().optional()
  }),

  search: Joi.object({
    plantId: commonFields.objectId.optional(),
    type: Joi.string().valid(
      'watering', 'fertilizing', 'pruning', 'repotting', 'pest_check', 
      'disease_check', 'harvest', 'observation', 'general'
    ).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    isActive: Joi.boolean().optional(),
    dueBefore: Joi.date().optional(),
    dueAfter: Joi.date().optional(),
    frequency: Joi.string().valid(
      'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'
    ).optional(),
    ...commonFields.pagination,
    ...commonFields.sorting
  })
};

// Search schemas
export const searchSchemas = {
  universal: Joi.object({
    q: Joi.string().trim().min(1).max(200).optional(),
    types: Joi.string().optional(), // comma-separated: plants,careLogs,reminders,posts
    category: Joi.string().optional(),
    tags: Joi.string().optional(), // comma-separated
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    location: Joi.string().max(100).optional(),
    healthStatus: Joi.string().valid('healthy', 'warning', 'critical', 'recovering').optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
    hasImages: Joi.boolean().optional(),
    isPublic: Joi.boolean().optional(),
    ...commonFields.pagination,
    ...commonFields.sorting
  }),

  suggestions: Joi.object({
    q: Joi.string().trim().min(1).max(100).required(),
    type: Joi.string().valid('plants', 'species', 'care', 'general').optional(),
    limit: Joi.number().integer().min(1).max(20).default(10)
  }),

  facets: Joi.object({
    type: Joi.string().valid('plants', 'careLogs', 'reminders', 'posts').optional()
  })
};

// Export all schemas
export default {
  auth: authSchemas,
  user: userSchemas,
  plant: plantSchemas,
  careLog: careLogSchemas,
  reminder: reminderSchemas,
  search: searchSchemas,
  common: commonFields
};