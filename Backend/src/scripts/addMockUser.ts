/**
 * Add Mock User Script
 * 
 * Adds a test user to the MongoDB database with hashed password
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

/**
 * Add mock user to database
 */
async function addMockUser() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully!');

    const email = 'sanukanm@gmail.com';
    const password = '200308';
    const name = 'Sanuka NM';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.info(`User with email ${email} already exists!`);
      logger.info(`User ID: ${existingUser._id}`);
      logger.info(`Name: ${existingUser.name}`);
      logger.info(`Role: ${existingUser.role}`);
      logger.info(`Is Email Verified: ${existingUser.isEmailVerified}`);
      logger.info(`Is Active: ${existingUser.isActive}`);
      
      // Update password if needed
      const updatePassword = true; // Set to true to update password
      if (updatePassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword;
        await existingUser.save();
        logger.info('✅ Password updated successfully!');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Hash password
    logger.info('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    logger.info('Creating new user...');
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      authProvider: 'local',
      isEmailVerified: true, // Set to true for testing
      isActive: true,
      status: 'active',
      preferences: {
        notifications: {
          email: true,
          push: true,
          inApp: true,
          marketing: false,
        },
        privacy: {
          showProfile: true,
          showEmail: false,
        },
      },
    });

    await newUser.save();

    logger.info('✅ Mock user created successfully!');
    logger.info('');
    logger.info('='.repeat(50));
    logger.info('User Details:');
    logger.info('='.repeat(50));
    logger.info(`ID: ${newUser._id}`);
    logger.info(`Name: ${newUser.name}`);
    logger.info(`Email: ${newUser.email}`);
    logger.info(`Password: ${password} (use this to login)`);
    logger.info(`Role: ${newUser.role}`);
    logger.info(`Is Email Verified: ${newUser.isEmailVerified}`);
    logger.info(`Is Active: ${newUser.isActive}`);
    logger.info(`Auth Provider: ${newUser.authProvider}`);
    logger.info(`Created At: ${newUser.createdAt}`);
    logger.info('='.repeat(50));
    logger.info('');
    logger.info('You can now login with:');
    logger.info(`  Email: ${email}`);
    logger.info(`  Password: ${password}`);
    logger.info('');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');

  } catch (error) {
    logger.error('Error adding mock user:', error);
    process.exit(1);
  }
}

// Run the script
addMockUser()
  .then(() => {
    logger.info('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
