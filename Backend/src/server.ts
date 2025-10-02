import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import { cache } from './config/redis';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { globalRateLimit, burstLimiter } from './middleware/rateLimiting';
import { setupSwagger } from './config/swagger';
import { CacheWarmer } from './middleware/cacheMiddleware';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import plantRoutes from './routes/plantRoutes';
import careLogRoutes from './routes/careLogRoutes';
import reminderRoutes from './routes/reminderRoutes';
import communityRoutes from './routes/communityRoutes';
import expertRoutes from './routes/expertRoutes';
import diseaseDetectionRoutes from './routes/diseaseDetectionRoutes';
import weatherRoutes from './routes/weatherRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import exportImportRoutes from './routes/exportImportRoutes';
import searchRoutes from './routes/searchRoutes';
import adminRoutes from './routes/adminRoutes';
import cacheRoutes from './routes/cacheRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Global rate limiting - applies to all routes
app.use(globalRateLimit);

// Burst protection - prevents rapid-fire requests
app.use('/api/', burstLimiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AgroTrack API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/care-logs', careLogRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/disease-detection', diseaseDetectionRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export-import', exportImportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cache', cacheRoutes);

// Serve uploaded files (if in production, use a CDN or cloud storage)
app.use('/uploads', express.static('uploads'));

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'AgroTrack API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/logout': 'Logout user'
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'PUT /api/users/profile': 'Update user profile',
        'DELETE /api/users/account': 'Delete user account'
      },
      plants: {
        'GET /api/plants': 'Get user plants',
        'POST /api/plants': 'Create new plant',
        'GET /api/plants/:id': 'Get plant by ID',
        'PUT /api/plants/:id': 'Update plant',
        'DELETE /api/plants/:id': 'Delete plant'
      },
      careLogs: {
        'GET /api/care-logs': 'Get care logs for user plants',
        'POST /api/care-logs': 'Create new care log',
        'GET /api/care-logs/:id': 'Get care log by ID',
        'PUT /api/care-logs/:id': 'Update care log',
        'DELETE /api/care-logs/:id': 'Delete care log'
      },
      reminders: {
        'GET /api/reminders': 'Get user reminders',
        'POST /api/reminders': 'Create new reminder',
        'PUT /api/reminders/:id': 'Update reminder',
        'DELETE /api/reminders/:id': 'Delete reminder',
        'POST /api/reminders/:id/complete': 'Mark reminder as complete'
      },
      analytics: {
        'GET /api/analytics/dashboard': 'Get dashboard analytics',
        'GET /api/analytics/plants': 'Get plant analytics',
        'GET /api/analytics/care-trends': 'Get care trends analytics'
      }
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Initialize Redis cache
    try {
      await cache.connect();
      logger.info('✅ Redis cache connected successfully');
      
      // Start cache warming in background
      if (process.env.NODE_ENV === 'production') {
        CacheWarmer.startPeriodicWarmup();
        logger.info('🔥 Cache warming started');
      }
    } catch (cacheError) {
      logger.warn('⚠️ Redis cache connection failed, continuing without cache:', cacheError);
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🌱 AgroTrack API server running on port ${PORT}`);
      logger.info(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📚 API docs available at http://localhost:${PORT}/api/docs`);
      logger.info(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health check at http://localhost:${PORT}/health`);
      logger.info(`🗄️ Cache management at http://localhost:${PORT}/api/cache/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  try {
    await cache.disconnect();
    logger.info('📦 Redis cache disconnected');
  } catch (error) {
    logger.error('Error disconnecting cache:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  try {
    await cache.disconnect();
    logger.info('📦 Redis cache disconnected');
  } catch (error) {
    logger.error('Error disconnecting cache:', error);
  }
  process.exit(0);
});

// Start the server
startServer();

export default app;