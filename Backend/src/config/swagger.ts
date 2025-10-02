import * as swaggerJSDoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgroTrack API',
      version: '1.0.0',
      description: `
        # AgroTrack Plant Management API
        
        A comprehensive REST API for plant care management, community features, and expert consultations.
        
        ## Features
        - 🌱 Plant management with care logging
        - 🔔 Smart AI-powered reminders  
        - 🏥 Disease detection and treatment
        - 🌤️ Weather integration
        - 👥 Community platform
        - 👨‍🔬 Expert consultations
        - 📊 Analytics and insights
        - 🔒 Secure authentication
        - ⚡ Rate limiting and security
        
        ## Authentication
        Most endpoints require authentication via JWT Bearer tokens. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        API endpoints are rate limited to prevent abuse:
        - General endpoints: 1000 requests per 15 minutes
        - Authentication: 50 requests per 15 minutes  
        - Login attempts: 10 requests per 15 minutes
        - Search: 100 requests per 15 minutes
        - Admin operations: 100 requests per 15 minutes
        
        ## Error Responses
        The API uses conventional HTTP response codes and returns JSON error objects:
        \`\`\`json
        {
          "success": false,
          "message": "Error description",
          "error": "Detailed error information"
        }
        \`\`\`
      `,
      contact: {
        name: 'AgroTrack API Support',
        email: 'support@agrotrack.com',
        url: 'https://agrotrack.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.agrotrack.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token'
        },
        refreshToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-refresh-token',
          description: 'Refresh token for obtaining new access tokens'
        }
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'An error occurred'
            },
            error: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Please provide a valid email address'
                  }
                }
              }
            }
          }
        },
        
        // User schemas
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'moderator', 'admin', 'super_admin'],
              example: 'user'
            },
            isEmailVerified: {
              type: 'boolean',
              example: true
            },
            profileImage: {
              type: 'string',
              example: 'https://example.com/profile.jpg'
            },
            bio: {
              type: 'string',
              example: 'Plant enthusiast and gardening expert'
            },
            location: {
              type: 'string',
              example: 'San Francisco, CA'
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:00:00Z'
            },
            lastActiveAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T14:30:00Z'
            }
          }
        },
        
        // Plant schemas
        Plant: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            name: {
              type: 'string',
              example: 'My Snake Plant'
            },
            species: {
              type: 'string',
              example: 'Sansevieria trifasciata'
            },
            commonName: {
              type: 'string',
              example: 'Snake Plant'
            },
            description: {
              type: 'string',
              example: 'A beautiful snake plant in my living room'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://example.com/plant1.jpg', 'https://example.com/plant2.jpg']
            },
            plantedDate: {
              type: 'string',
              format: 'date',
              example: '2023-06-15'
            },
            location: {
              type: 'string',
              example: 'Living Room Window'
            },
            careInstructions: {
              type: 'object',
              properties: {
                watering: {
                  type: 'object',
                  properties: {
                    frequency: {
                      type: 'string',
                      example: 'weekly'
                    },
                    amount: {
                      type: 'string',
                      example: '200ml'
                    },
                    notes: {
                      type: 'string',
                      example: 'Water when soil is dry'
                    }
                  }
                },
                fertilizing: {
                  type: 'object',
                  properties: {
                    frequency: {
                      type: 'string',
                      example: 'monthly'
                    },
                    type: {
                      type: 'string',
                      example: 'liquid fertilizer'
                    }
                  }
                }
              }
            },
            healthStatus: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor'],
              example: 'good'
            },
            owner: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:00:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T14:30:00Z'
            }
          }
        },
        
        // Care Log schemas
        CareLog: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            plant: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            careType: {
              type: 'string',
              enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'pest-control', 'other'],
              example: 'watering'
            },
            notes: {
              type: 'string',
              example: 'Watered thoroughly, soil was quite dry'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://example.com/care1.jpg']
            },
            careDate: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T09:00:00Z'
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T09:15:00Z'
            }
          }
        },
        
        // Reminder schemas
        Reminder: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439014'
            },
            plant: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            title: {
              type: 'string',
              example: 'Water Snake Plant'
            },
            description: {
              type: 'string',
              example: 'Time to water your snake plant'
            },
            careType: {
              type: 'string',
              enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'pest-control', 'other'],
              example: 'watering'
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-20T09:00:00Z'
            },
            isCompleted: {
              type: 'boolean',
              example: false
            },
            isRecurring: {
              type: 'boolean',
              example: true
            },
            recurringPattern: {
              type: 'object',
              properties: {
                frequency: {
                  type: 'string',
                  enum: ['daily', 'weekly', 'monthly'],
                  example: 'weekly'
                },
                interval: {
                  type: 'number',
                  example: 1
                }
              }
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:00:00Z'
            }
          }
        },
        
        // Community schemas
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439015'
            },
            title: {
              type: 'string',
              example: 'My Snake Plant is Thriving!'
            },
            content: {
              type: 'string',
              example: 'Look at how well my snake plant is doing after following the care tips'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://example.com/post1.jpg']
            },
            author: {
              $ref: '#/components/schemas/User'
            },
            plant: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['snake-plant', 'success-story', 'indoor-plants']
            },
            likes: {
              type: 'number',
              example: 25
            },
            comments: {
              type: 'number',
              example: 8
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T14:30:00Z'
            }
          }
        },
        
        // Pagination schema
        PaginationMeta: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'number',
              example: 1
            },
            totalPages: {
              type: 'number',
              example: 5
            },
            totalItems: {
              type: 'number',
              example: 48
            },
            itemsPerPage: {
              type: 'number',
              example: 10
            },
            hasNextPage: {
              type: 'boolean',
              example: true
            },
            hasPreviousPage: {
              type: 'boolean',
              example: false
            }
          }
        }
      },
      
      // Common parameters
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and direction (e.g., "createdAt:desc")',
          required: false,
          schema: {
            type: 'string',
            example: 'createdAt:desc'
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query string',
          required: false,
          schema: {
            type: 'string',
            example: 'snake plant'
          }
        }
      },
      
      // Common responses
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: 'No valid authentication token provided'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: 'You do not have permission to access this resource'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: 'The requested resource could not be found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
                retryAfter: '15 minutes'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Internal server error',
                error: 'An unexpected error occurred'
              }
            }
          }
        }
      }
    },
    
    // Security applied globally
    security: [
      {
        bearerAuth: []
      }
    ],
    
    // Tags for grouping endpoints
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management'
      },
      {
        name: 'Users',
        description: 'User profile and account operations'
      },
      {
        name: 'Plants',
        description: 'Plant management and CRUD operations'
      },
      {
        name: 'Care Logs',
        description: 'Plant care activity tracking'
      },
      {
        name: 'Reminders',
        description: 'Smart reminders and scheduling'
      },
      {
        name: 'Community',
        description: 'Social features and community posts'
      },
      {
        name: 'Expert Consultation',
        description: 'Expert advice and consultation booking'
      },
      {
        name: 'Disease Detection',
        description: 'AI-powered plant disease identification'
      },
      {
        name: 'Weather',
        description: 'Weather data and plant care recommendations'
      },
      {
        name: 'Notifications',
        description: 'Push notifications and preferences'
      },
      {
        name: 'Analytics',
        description: 'User analytics and insights'
      },
      {
        name: 'Export/Import',
        description: 'Data export and import operations'
      },
      {
        name: 'Search',
        description: 'Universal search and filtering'
      },
      {
        name: 'Admin',
        description: 'Administrative functions'
      },
      {
        name: 'System',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    './src/routes/*.ts', // Path to the API routes
    './src/controllers/*.ts', // Path to the controllers
    './src/models/*.ts', // Path to the models
    './src/docs/*.ts' // Path to the documentation files
  ]
};

// Generate the Swagger specification
const swaggerSpec = swaggerJSDoc.default(swaggerOptions);

// Setup Swagger UI
export const setupSwagger = (app: Express): void => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayOperationId: false,
      tryItOutEnabled: true
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2d5f3f; }
      .swagger-ui .scheme-container { background: #f8f9fa; }
      .swagger-ui .auth-wrapper { margin: 20px 0; }
    `,
    customSiteTitle: 'AgroTrack API Documentation',
    customfavIcon: '/favicon.ico'
  };
  
  // Serve Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Serve raw Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📚 Swagger documentation available at /api-docs');
  console.log('📄 Swagger JSON available at /api-docs.json');
};

export { swaggerSpec };