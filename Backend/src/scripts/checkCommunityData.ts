import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkCommunityData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to database\n');
    
    const collections = [
      'communityusers',
      'communityposts', 
      'communitycomments',
      'communityvotes',
      'communityreports'
    ];
    
    console.log('📊 Community Forum Data:\n');
    
    for (const col of collections) {
      try {
        const count = await mongoose.connection.db.collection(col).countDocuments();
        console.log(`   ${col}: ${count} documents`);
      } catch (error) {
        console.log(`   ${col}: collection not found`);
      }
    }
    
    console.log('\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCommunityData();
