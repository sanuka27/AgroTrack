import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Collections to KEEP
const KEEP_COLLECTIONS = ['users', 'posts', 'comments', 'votes', 'reports'];

async function cleanDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sanuka:Sanuka123@agrotrack.vdhiw.mongodb.net/agrotrack?retryWrites=true&w=majority&appName=AgroTrack';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Get all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('Current collections in database:');
    collectionNames.forEach(name => console.log(`  - ${name}`));
    console.log('');

    // Find collections to remove
    const collectionsToRemove = collectionNames.filter(
      name => !KEEP_COLLECTIONS.includes(name)
    );

    if (collectionsToRemove.length === 0) {
      console.log('✓ No collections to remove. Database is clean!\n');
    } else {
      console.log(`Found ${collectionsToRemove.length} collections to remove:\n`);
      
      for (const collectionName of collectionsToRemove) {
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`  ✓ Removed: ${collectionName}`);
        } catch (error) {
          console.log(`  ✗ Failed to remove: ${collectionName} - ${(error as Error).message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('FINAL DATABASE STATE');
    console.log('='.repeat(60));
    
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    const finalNames = finalCollections.map(c => c.name);
    
    console.log('\nRemaining collections:');
    for (const name of finalNames) {
      const collection = mongoose.connection.db.collection(name);
      const count = await collection.countDocuments();
      console.log(`  ✓ ${name.padEnd(20)} (${count} documents)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total collections: ${finalNames.length}`);
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    console.log('\n✅ Database cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDatabase();
