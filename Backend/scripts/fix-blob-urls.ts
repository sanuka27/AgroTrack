/**
 * Fix Blob URLs in Plant Collection
 * 
 * This script finds and removes invalid blob: URLs from plant imageUrl fields.
 * Blob URLs are local browser memory references that don't persist across sessions.
 * 
 * Usage:
 *   npx ts-node scripts/fix-blob-urls.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface PlantDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  imageUrl?: string;
}

async function fixBlobUrls() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get plants collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const plantsCollection = db.collection<PlantDoc>('plants');

    // Find plants with blob URLs
    console.log('🔍 Searching for plants with blob: URLs...');
    const plantsWithBlobUrls = await plantsCollection.find({
      imageUrl: { $regex: /^blob:/ }
    }).toArray();

    console.log(`Found ${plantsWithBlobUrls.length} plant(s) with blob URLs\n`);

    if (plantsWithBlobUrls.length === 0) {
      console.log('✨ No blob URLs found. Database is clean!');
      process.exit(0);
    }

    // Display affected plants
    console.log('📋 Affected plants:');
    plantsWithBlobUrls.forEach((plant, idx) => {
      console.log(`  ${idx + 1}. ${plant.name} (${plant._id})`);
      console.log(`     Invalid URL: ${plant.imageUrl}`);
    });

    console.log('\n⚠️  This script will remove the invalid blob URLs from these plants.');
    console.log('    The imageUrl field will be set to undefined/null.');
    console.log('    Users will need to re-upload their plant images.\n');

    // In a real scenario, you might want to prompt for confirmation here
    // For now, we'll proceed automatically

    console.log('🔧 Fixing blob URLs...\n');

    // Remove blob URLs
    const result = await plantsCollection.updateMany(
      { imageUrl: { $regex: /^blob:/ } },
      { $unset: { imageUrl: '' } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} plant(s)`);
    console.log('   - Removed invalid blob: URLs');
    console.log('   - Users can now re-upload images through the UI\n');

    // Show summary
    const remainingBlobUrls = await plantsCollection.countDocuments({
      imageUrl: { $regex: /^blob:/ }
    });

    if (remainingBlobUrls === 0) {
      console.log('✨ CLEANUP COMPLETE! All blob URLs have been removed.');
    } else {
      console.log(`⚠️  Warning: ${remainingBlobUrls} blob URL(s) still remain. Please investigate.`);
    }

  } catch (error) {
    console.error('❌ Error fixing blob URLs:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixBlobUrls();
