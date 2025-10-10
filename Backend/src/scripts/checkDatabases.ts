import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Script to check which database has data and consolidate if needed
 */

async function checkDatabases() {
  const baseUri = process.env.MONGODB_URI?.split('?')[0]?.replace(/\/[^/]*$/, '');
  
  if (!baseUri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  const databases = ['agrotrack', 'agrotrack_db'];
  
  console.log('🔍 Checking MongoDB databases...\n');
  
  for (const dbName of databases) {
    const uri = `${baseUri}/${dbName}?retryWrites=true&w=majority`;
    
    try {
      console.log(`\n📊 Checking database: ${dbName}`);
      console.log('━'.repeat(50));
      
      await mongoose.connect(uri);
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`✅ Connected to "${dbName}"`);
      console.log(`📁 Collections found: ${collections.length}`);
      
      if (collections.length === 0) {
        console.log('   ⚠️  Database is empty - no collections');
      } else {
        console.log('\n   Collections:');
        for (const collection of collections) {
          const count = await mongoose.connection.db.collection(collection.name).countDocuments();
          console.log(`   - ${collection.name}: ${count} documents`);
        }
      }
      
      await mongoose.disconnect();
      
    } catch (error: any) {
      console.error(`❌ Error connecting to "${dbName}":`, error.message);
    }
  }
  
  console.log('\n' + '━'.repeat(50));
  console.log('\n💡 Recommendation:');
  console.log('   1. Use the database that has your data (collections with documents)');
  console.log('   2. Update your .env file: MONGODB_URI=...mongodb.net/DATABASE_NAME?...');
  console.log('   3. If you have data in both, you may need to migrate one to the other');
  console.log('   4. Delete the empty database from MongoDB Atlas dashboard\n');
}

checkDatabases()
  .then(() => {
    console.log('✅ Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
