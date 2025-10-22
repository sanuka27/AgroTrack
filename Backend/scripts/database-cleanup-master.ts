/**
 * ═══════════════════════════════════════════════════════════════
 * 🧹 AGROTRACK DATABASE CLEANUP - MASTER SCRIPT
 * ═══════════════════════════════════════════════════════════════
 *
 * Purpose: Clean up unwanted, empty, and deleted collections.
 * Also includes:
 *  - --watch       : Auto-drop blacklisted collections the moment they reappear
 *  - --lock-views  : Prevent re-creation by creating read-only VIEWS with the
 *                    same names (writes will fail with "cannot write to a view")
 *
 * ⚠️  IMPORTANT: Keep this file permanently!
 *
 * Usage:
 *   npx ts-node Backend/scripts/database-cleanup-master.ts
 *   npx ts-node Backend/scripts/database-cleanup-master.ts --watch
 *   npx ts-node Backend/scripts/database-cleanup-master.ts --lock-views
 *
 * Or add to package.json:
 *   "db:cleanup": "ts-node Backend/scripts/database-cleanup-master.ts",
 *   "db:watch": "ts-node Backend/scripts/database-cleanup-master.ts --watch",
 *   "db:lock": "ts-node Backend/scripts/database-cleanup-master.ts --lock-views"
 *
 * ═══════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

/* ──────────────────────────────────────────────────────────────
   CONFIGURATION
   ────────────────────────────────────────────────────────────── */

const COLLECTIONS_TO_KEEP = [
  'users',
  'plants',
  'posts',
  'votes',
  'reports',
  'comments_backup', // Keep backup for safety
  'ai_recommendations',
  'reminders',
  'carelogs', // Recreated care log system
];

const FORCE_DELETE_PATTERNS = [
  '_deleted',      // All *_deleted collections
  '_backup_merged' // All *_backup_merged collections
];

const EMPTY_COLLECTIONS_TO_REMOVE = [
  // Removed features/collections that were deleted from the project
  'comments', // No longer used
  'communityreports', // Community features removed
  'communityposts', // Community features removed
  'communityvotes', // Community features removed
  'dashboardanalytics', // Analytics features removed
  'useranalytics', // Analytics features removed
  'plantcareanalytics', // Analytics features removed
  'exportimportoperations', // Export/import features removed
  'notificationpreferences', // Merged into user preferences
  'notifications', // Notification system simplified
  'bugreports', // Bug reporting removed
  'contactmessages', // Contact form removed
  'systemmetrics', // System metrics removed
  'chatmessages', // Chat features removed
  'ai_suggestions', // AI suggestions removed
  // Weather integration was removed from project
];

/** Names you NEVER want to exist again. */
const BLACKLIST = new Set<string>([
  'communityposts',
  'communitycomments',
  'communityvotes',
  'communityreports',
  'dashboardanalytics',
  'useranalytics',
  'plantcareanalytics',
  'weatherdata', // Weather integration removed
  'weatherforecasts', // Weather integration removed
  // Add more if needed
]);

/* ──────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
   ────────────────────────────────────────────────────────────── */

async function connectDB() {
  try {
    // Optional hardening if your app tends to auto-create & auto-index
    mongoose.set('autoCreate', false);
    mongoose.set('autoIndex', false);
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
  } catch {
    return { name, count: 0, exists: false };
  }
}

/* ──────────────────────────────────────────────────────────────
   MAIN CLEANUP LOGIC
   ────────────────────────────────────────────────────────────── */

async function analyzeDatabase() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 DATABASE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Database connection not available');
    return { toKeep: [] as string[], toDelete: [] as string[], empty: [] as string[] };
  }

  const collections = await db.listCollections().toArray();
  const allCollections = collections.map((c: any) => c.name);

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
      if (error?.codeName === 'NamespaceNotFound') {
        console.log(`ℹ️  Already gone: ${name}`);
      } else {
        console.log(`❌ Failed to drop ${name}:`, error?.message || error);
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
      if (error?.codeName === 'NamespaceNotFound') {
        console.log(`ℹ️  Already gone: ${name}`);
      } else {
        console.log(`❌ Failed to drop ${name}:`, error?.message || error);
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
  const active: Array<{ name: string; count: number; type?: string }> = [];
  const backup: Array<{ name: string; count: number; type?: string }> = [];

  for (const coll of collections) {
    const name = coll.name as string;
    const type = (coll as any).type as string | undefined; // 'collection' | 'view'
    let count = 0;
    try {
      // countDocuments doesn't work on views before 4.4 in some envs; safe-guard
      if (mongoose.connection.db) {
        count = await mongoose.connection.db.collection(name).countDocuments();
      }
    } catch {
      // ignore
    }

    const item = { name, count, type };
    if (name.includes('_backup')) {
      backup.push(item);
    } else {
      active.push(item);
    }
  }

  active.sort((a, b) => a.name.localeCompare(b.name));
  backup.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`✅ Active Collections (${active.length}):`);
  console.log('─'.repeat(60));
  active.forEach(c => {
    const tag = c.type === 'view' ? '🔎(view)' : '📄';
    console.log(`  ${tag} ${c.name.padEnd(30)} ${c.count.toString().padStart(6)} docs`);
  });

  if (backup.length > 0) {
    console.log(`\n📦 Backup Collections (${backup.length}):`);
    console.log('─'.repeat(60));
    backup.forEach(c => {
      const tag = c.type === 'view' ? '🔎(view)' : '💾';
      console.log(`  ${tag} ${c.name.padEnd(30)} ${c.count.toString().padStart(6)} docs`);
    });
  }

  const totalDocs = [...active, ...backup].reduce((sum, c) => sum + (c.count || 0), 0);
  console.log('\n' + '─'.repeat(60));
  console.log(`📊 Total: ${active.length + backup.length} collections, ${totalDocs} documents`);
}

/* ──────────────────────────────────────────────────────────────
   WATCH MODE (auto-drop blacklisted collections instantly)
   ────────────────────────────────────────────────────────────── */

async function watchAndAutoDrop() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('DB not connected');

  // Watch for collection creates/inserts that indicate a zombie reappeared
  const pipeline = [{ $match: { operationType: { $in: ['create', 'insert'] } } }];

  // Change streams require replica set / Atlas
  const changeStream = db.watch(pipeline as any);

  console.log('👀 Watch mode: listening for unwanted collections...');

  changeStream.on('change', async (event: any) => {
    const coll = event?.ns?.coll;
    if (!coll) return;
    if (!BLACKLIST.has(coll)) return;

    console.log(`🚨 Detected ${event.operationType} on '${coll}'. Dropping...`);
    try {
      await db.collection(coll).drop();
      console.log(`✅ Auto-dropped: ${coll}`);
    } catch (err: any) {
      if (err?.codeName === 'NamespaceNotFound') {
        console.log(`ℹ️ Already gone: ${coll}`);
      } else {
        console.error(`❌ Failed to drop ${coll}:`, err?.message || err);
      }
    }
  });

  changeStream.on('error', (err) => {
    console.error('❌ Change stream error:', err);
    // Optional: exit so a supervisor (PM2/systemd) restarts this watcher
    // process.exit(1);
  });

  // Keep process alive
  process.stdin.resume();
}

/* ──────────────────────────────────────────────────────────────
   LOCK-VIEWS MODE (prevent recreation by making read-only views)
   ────────────────────────────────────────────────────────────── */

async function ensureBlockerCollection(db: any) {
  // A tiny real collection that views will "point at"
  const all = await db.listCollections().toArray();
  const exists = all.some((c: any) => c.name === '_blocker_nullsrc' && c.type !== 'view');
  if (!exists) {
    await db.createCollection('_blocker_nullsrc');
    console.log('🧱 Created helper collection: _blocker_nullsrc');
  }
}

async function createBlockingView(db: any, viewName: string) {
  try {
    await db.createCollection(viewName, {
      viewOn: '_blocker_nullsrc',
      pipeline: [{ $match: { _id: null } }], // empty
    } as any);
    console.log(`🔒 Created blocking VIEW: ${viewName}`);
  } catch (e: any) {
    if (e?.codeName === 'NamespaceExists') {
      console.log(`ℹ️ Blocking view/collection already exists: ${viewName}`);
    } else {
      throw e;
    }
  }
}

/** Drop real collection if present, then create a read-only view with the same name. */
async function dropIfRealCollectionThenLockAsView(db: any, name: string) {
  const all = await db.listCollections().toArray();
  const meta = all.find((c: any) => c.name === name);

  if (meta) {
    if (meta.type === 'view') {
      console.log(`🔒 Already locked as view: ${name}`);
      return;
    }
    try {
      await db.collection(name).drop();
      console.log(`✅ Dropped real collection: ${name}`);
    } catch (e: any) {
      console.log(`❌ Failed to drop ${name}:`, e?.message || e);
    }
  }

  await ensureBlockerCollection(db);
  await createBlockingView(db, name);
}

async function lockBlacklistedAsViews() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('DB not connected');

  for (const name of BLACKLIST) {
    await dropIfRealCollectionThenLockAsView(db, name);
  }
  console.log('✅ All blacklisted names locked as read-only views.');
}

/* ──────────────────────────────────────────────────────────────
   MAIN EXECUTION (one-shot cleanup)
   ────────────────────────────────────────────────────────────── */

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
  console.log('   - This script will never delete your main collections\n');

  await mongoose.disconnect();
  process.exit(0);
}

/* ──────────────────────────────────────────────────────────────
   ERROR HANDLING + CLI SWITCHBOARD
   ────────────────────────────────────────────────────────────── */

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// CLI router:
//   default      → one-shot cleanup
//   --watch      → run watcher (does not exit)
//   --lock-views → lock BLACKLIST names as read-only views (then exit)
(async () => {
  const WATCH = process.argv.includes('--watch');
  const LOCK_VIEWS = process.argv.includes('--lock-views');

  if (WATCH) {
    const ok = await connectDB();
    if (!ok) process.exit(1);
    await watchAndAutoDrop(); // keep alive
    return;
  }

  if (LOCK_VIEWS) {
    const ok = await connectDB();
    if (!ok) process.exit(1);
    await lockBlacklistedAsViews();
    await showFinalState();
    await mongoose.disconnect();
    process.exit(0);
  }

  // default path: one-shot cleanup
  await main().catch(error => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
})();