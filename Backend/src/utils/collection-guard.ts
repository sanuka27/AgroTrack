// src/utils/collection-guard.ts
import type { Db } from 'mongodb';

const BLACKLIST = new Set<string>([
  'communityposts', // old name, replaced by 'posts'
  'communitycomments', // old name, replaced by 'comments'
  'communityvotes', // old name, replaced by 'votes'
  'communityreports', // duplicate, replaced by 'reports'
  'dashboardanalytics', // removed analytics
  'useranalytics', // removed analytics
  'plantcareanalytics', // removed analytics
  'weatherdata', // removed weather features
  'weatherforecasts', // removed weather features
  'notifications', // removed notifications
  'bugreports', // removed bug reports
  'notificationpreferences', // removed preferences
  'exportimportoperations', // removed export/import
  'likes', // replaced by votes
  'systemmetrics', // removed metrics
  'contactmessages', // removed contact
  'chatmessages', // removed chat
  'carelogs', // removed care logs
  'reminders', // removed reminders
]);

// Helper to wrap a method and guard by collection name
function guard(
  target: any,
  method: string,
  getName: (args: any[]) => string | undefined
) {
  const orig = target[method];
  if (!orig) return;
  target[method] = function (...args: any[]) {
    const name = getName(args);
    if (name && BLACKLIST.has(name)) {
      throw new Error(
        `[CollectionGuard] Blocked ${method} on blacklisted collection '${name}'. ` +
        `Remove/rename this model or route.`
      );
    }
    return orig.apply(this, args);
  };
}

/**
 * Call this AFTER you have a live mongoose connection,
 * and BEFORE your app starts serving traffic.
 */
export function installCollectionGuard(db: Db) {
  // 1) Prevent explicit creation
  guard(db, 'createCollection', (args) => args?.[0]);

  // 2) Prevent implicit writes on unknown or blacklisted names
  //    We hook common write methods on the "Collection" prototype.
  const CollectionProto = (db.collection('dummy') as any).constructor.prototype;

  const getCollName = function (this: any) {
    return this && this.collectionName ? this.collectionName : undefined;
  };

  for (const m of [
    'insertOne', 'insertMany',
    'updateOne', 'updateMany', 'replaceOne', 'findOneAndUpdate',
    'deleteOne', 'deleteMany', 'findOneAndDelete',
    'bulkWrite',
    'createIndex', 'createIndexes',
    'drop', 'dropIndexes'
  ]) {
    guard(CollectionProto, m, function () { return getCollName.call(this); });
  }

  // 3) Optionally block db.collection('badname') entirely, to be extra strict:
  guard(db, 'collection', (args) => args?.[0]);

  // 4) Optional: lock bad names as views from code (no CLI needed)
  //    You can keep this enabled or run once at boot.
  (async () => {
    const all = await db.listCollections().toArray();
    const names = new Set(all.map((c: any) => c.name));
    // helper collection for empty views
    if (!names.has('_blocker_nullsrc')) {
      await db.createCollection('_blocker_nullsrc').catch(() => {});
    }
    for (const name of BLACKLIST) {
      const meta = all.find((c: any) => c.name === name);
      if (!meta || meta.type !== 'view') {
        // Drop if real collection, then create view that matches nothing
        if (meta && meta.type !== 'view') {
          try { await db.collection(name).drop(); } catch {
            // Ignore drop errors - collection might not exist or be droppable
          }
        }
        try {
          await db.createCollection(name, {
            viewOn: '_blocker_nullsrc',
            pipeline: [{ $match: { _id: null } }],
          } as any);
          // eslint-disable-next-line no-console
          console.log(`[CollectionGuard] Locked '${name}' as read-only view`);
        } catch {
          // Ignore view creation errors - might already exist or be blocked
        }
      }
    }
  })().catch(() => {});
}