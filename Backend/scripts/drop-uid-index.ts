import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function dropUidIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available after mongoose.connect');
    }
    const usersCollection = db.collection('users');

    // List current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (name: ${index.name})`);
    });

    // Drop the uid_1 index if it exists
    try {
      console.log('\n🗑️  Attempting to drop uid_1 index...');
      await usersCollection.dropIndex('uid_1');
      console.log('✅ Successfully dropped uid_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️  uid_1 index does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // List indexes after cleanup
    console.log('\n📋 Indexes after cleanup:');
    const updatedIndexes = await usersCollection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (name: ${index.name})`);
    });

    console.log('\n✅ Index cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropUidIndex();
