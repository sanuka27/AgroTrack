/**
 * ═══════════════════════════════════════════════════════════════
 * 🧹 AGROTRACK DATABASE CLEANUP - MASTER SCRIPT
 * ═══════════════════════════════════════════════════════════════
 * 
 * Purpose: Clean up unwanted, empty, and deleted collections
 * 
 * ⚠️  IMPORTANT: Keep this file permanently!
 * 
 * This script safely removes:
 * - Empty collections (comments, communityreports)
 * - *_deleted collections (old data marked for deletion)
 * - Duplicate collections
 * - Temporary/backup collections (optional)
 * 
 * Run this script anytime your database gets cluttered.
 * 
 * Usage: 
 *   npx ts-node scripts/database-cleanup-master.ts
 * 
 * Or add to package.json:
 *   "db:cleanup": "ts-node scripts/database-cleanup-master.ts"
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const COLLECTIONS_TO_KEEP = [
  'users',
  'plants',
  'posts',
  'votes',
  'reports',
  'comments_backup', // Keep backup for safety
  'ai_recommendations',
  'reminders',
];

const FORCE_DELETE_PATTERNS = [
  '_deleted',      // All *_deleted collections
  '_backup_merged' // All *_backup_merged collections
];

const EMPTY_COLLECTIONS_TO_REMOVE = [
  'comments',
  'communityreports',
  'communityposts',
  'communityvotes',
  'dashboardanalytics',
  'useranalytics',
  'plantcareanalytics',
  'exportimportoperations',
  'notificationpreferences',
  'notifications',
  'carelogs',
  'reminders',
  'bugreports',
  'contactmessages',
  'systemmetrics',
  'chatmessages',
  'ai_suggestions',
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

function shouldKeep(collectionName: string): boolean {
  return COLLECTIONS_TO_KEEP.includes(collectionName);
}

function matchesDeletePattern(collectionName: string): boolean {
  return FORCE_DELETE_PATTERNS.some(pattern => collectionName.includes(pattern));
}

async function getCollectionInfo(db: any, name: string) {
  try {
    const count = await db.collection(name).countDocuments();
    return { name, count, exists: true };
  } catch (error) {
    return { name, count: 0, exists: false };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLEANUP LOGIC
// ═══════════════════════════════════════════════════════════════

async function analyzeDatabase() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 DATABASE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Database connection not available');
    return { toKeep: [], toDelete: [], empty: [] };
  }

  const collections = await db.listCollections().toArray();
  const allCollections = collections.map(c => c.name);

  const toKeep: string[] = [];
  const toDelete: string[] = [];
  const empty: string[] = [];

  for (const name of allCollections) {
    const info = await getCollectionInfo(db, name);
    
    if (shouldKeep(name)) {
      toKeep.push(name);
      console.log(`✅ KEEP: ${name} (${info.count} documents)`);
    } else if (matchesDeletePattern(name)) {
      toDelete.push(name);
      console.log(`🗑️  DELETE: ${name} (matches delete pattern)`);
    } else if (info.count === 0 && EMPTY_COLLECTIONS_TO_REMOVE.includes(name)) {
      empty.push(name);
      console.log(`🧹 CLEAN: ${name} (empty)`);
    } else if (info.count === 0) {
      empty.push(name);
      console.log(`⚠️  EMPTY: ${name} (0 documents - will remove)`);
    } else {
      console.log(`⚠️  UNKNOWN: ${name} (${info.count} documents - will keep)`);
      toKeep.push(name);
    }
  }

  return { toKeep, toDelete, empty };
}

async function cleanupCollections(toDelete: string[], empty: string[]) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧹 CLEANUP EXECUTION');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const db = mongoose.connection.db;
  if (!db) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  // Delete collections matching patterns
  for (const name of toDelete) {
    try {
      await db.collection(name).drop();
      console.log(`✅ Dropped: ${name}`);
      success++;
    } catch (error: any) {
      if (error.codeName === 'NamespaceNotFound') {
        console.log(`ℹ️  Already gone: ${name}`);
      } else {
        console.log(`❌ Failed to drop ${name}:`, error.message);
        failed++;
      }
    }
  }

  // Delete empty collections
  for (const name of empty) {
    try {
      const count = await db.collection(name).countDocuments();
      if (count === 0) {
        await db.collection(name).drop();
        console.log(`✅ Dropped empty: ${name}`);
        success++;
      } else {
        console.log(`⚠️  Skipped ${name}: has ${count} documents`);
      }
    } catch (error: any) {
      if (error.codeName === 'NamespaceNotFound') {
        console.log(`ℹ️  Already gone: ${name}`);
      } else {
        console.log(`❌ Failed to drop ${name}:`, error.message);
        failed++;
      }
    }
  }

  return { success, failed };
}

async function showFinalState() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📋 FINAL DATABASE STATE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.listCollections().toArray();
  const active: Array<{name: string; count: number}> = [];
  const backup: Array<{name: string; count: number}> = [];

  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    if (coll.name.includes('_backup')) {
      backup.push({ name: coll.name, count });
    } else {
      active.push({ name: coll.name, count });
    }
  }

  // Sort by name
  active.sort((a, b) => a.name.localeCompare(b.name));
  backup.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`✅ Active Collections (${active.length}):`);
  console.log('─'.repeat(60));
  active.forEach(c => {
    console.log(`  📄 ${c.name.padEnd(30)} ${c.count.toString().padStart(6)} docs`);
  });

  if (backup.length > 0) {
    console.log(`\n📦 Backup Collections (${backup.length}):`);
    console.log('─'.repeat(60));
    backup.forEach(c => {
      console.log(`  💾 ${c.name.padEnd(30)} ${c.count.toString().padStart(6)} docs`);
    });
  }

  const totalDocs = [...active, ...backup].reduce((sum, c) => sum + c.count, 0);
  console.log('\n' + '─'.repeat(60));
  console.log(`📊 Total: ${active.length + backup.length} collections, ${totalDocs} documents`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║       🧹 AGROTRACK DATABASE CLEANUP - MASTER SCRIPT 🧹        ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  // Step 1: Analyze
  const { toKeep, toDelete, empty } = await analyzeDatabase();

  // Step 2: Confirm
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📝 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`✅ Collections to keep: ${toKeep.length}`);
  console.log(`🗑️  Collections to delete (patterns): ${toDelete.length}`);
  console.log(`🧹 Empty collections to remove: ${empty.length}`);
  console.log(`📊 Total cleanup: ${toDelete.length + empty.length} collections\n`);

  if (toDelete.length === 0 && empty.length === 0) {
    console.log('✨ Database is already clean! Nothing to do.\n');
  } else {
    // Step 3: Execute cleanup
    const { success, failed } = await cleanupCollections(toDelete, empty);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📈 CLEANUP RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`✅ Successfully removed: ${success} collections`);
    if (failed > 0) {
      console.log(`❌ Failed to remove: ${failed} collections`);
    }
  }

  // Step 4: Show final state
  await showFinalState();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ CLEANUP COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('💡 Tips:');
  console.log('   - Run this script anytime your database gets cluttered');
  console.log('   - Backup collections are kept for safety');
  console.log('   - After 1-2 weeks, you can manually drop backup collections');
  console.log('   - This script will never delete your main 5 collections\n');

  await mongoose.disconnect();
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('\n❌ Cleanup failed:', error);
  process.exit(1);
});
