import mongoose from 'mongoose';
import { logger } from './logger';

export const connectDatabase = async (): Promise<void> => {
  if (process.env.SKIP_MONGODB === 'true') {
    logger.info('MongoDB connection skipped (SKIP_MONGODB=true)');
    return;
  }

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI environment variable is required when SKIP_MONGODB is not set to true');
  }

  try {
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(mongoURI, options);
    
    logger.info(`📦 MongoDB connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    // Don't exit in development mode
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (process.env.SKIP_MONGODB === 'true') {
    logger.info('MongoDB disconnect skipped (SKIP_MONGODB=true)');
    return;
  }

  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};