#!/usr/bin/env ts-node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { MigrationRunner, MigrationResult } from './runner.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('Set it in your .env file or export MONGODB_URI=mongodb://localhost:27017/yourdb');
  process.exit(1);
}

// Print backup reminder
function printBackupReminder() {
  const dbName = MONGODB_URI!.split('/').pop()?.split('?')[0] || 'yourdb';
  console.log('\n🛡️  IMPORTANT: BACKUP YOUR DATABASE BEFORE MIGRATION');
  console.log('==================================================');
  console.log(`Run this command to create a backup:`);
  console.log(`mongodump --db ${dbName} --out backup_$(date +%Y%m%d_%H%M%S)`);
  console.log('');
  console.log('Or if using a custom URI:');
  console.log(`mongodump --uri="${MONGODB_URI}" --out backup_$(date +%Y%m%d_%H%M%S)`);
  console.log('==================================================\n');
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      description: 'Run migration in dry-run mode (no writes)',
      default: false
    })
    .option('resume', {
      alias: 'r',
      type: 'boolean',
      description: 'Resume from last checkpoint',
      default: false
    })
    .option('batch', {
      alias: 'b',
      type: 'number',
      description: 'Batch size for processing',
      default: 500
    })
    .option('drop-old', {
      type: 'boolean',
      description: 'Drop old collections after successful migration',
      default: false
    })
    .option('step', {
      alias: 's',
      type: 'string',
      description: 'Run only specific step (e.g., users, posts, analytics)',
    })
    .help()
    .argv;

  printBackupReminder();

  if (argv.dryRun) {
    console.log('🔍 Running in DRY-RUN mode - no data will be modified');
  }

  const runner = new MigrationRunner(MONGODB_URI!);
  await runner.connect();
  await runner.loadCheckpoints();

  const results: MigrationResult[] = [];
  let hasErrors = false;

  try {
    // Import and run steps dynamically
    const steps = [
      'users',
      'posts',
      'analytics',
      'plant_logs',
      'blogs',
      'notifications',
      'messages',
      'reports',
      'plants',
      'systemlogs'
    ];

    const stepsToRun = argv.step ? [argv.step] : steps;

    for (const stepName of stepsToRun) {
      try {
        const { default: stepFunction } = await import(`./steps/${stepName}`);
        const result = await stepFunction(runner, {
          batchSize: argv.batch,
          isDryRun: argv.dryRun,
          resume: argv.resume
        });
        results.push(result);

        if (result.status === 'failed') {
          hasErrors = true;
          if (!argv.dryRun) {
            console.error(`❌ Step ${stepName} failed, stopping migration`);
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Failed to load/run step ${stepName}:`, error);
        hasErrors = true;
        break;
      }
    }

    // Print summary
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('===================');
    console.table(results);

    const totalSource = results.reduce((sum, r) => sum + r.sourceCount, 0);
    const totalInserted = results.reduce((sum, r) => sum + r.insertedCount, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skippedDuplicates, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n🎯 OVERALL RESULTS:');
    console.log(`Source documents: ${totalSource.toLocaleString()}`);
    console.log(`Inserted: ${totalInserted.toLocaleString()}`);
    console.log(`Skipped duplicates: ${totalSkipped.toLocaleString()}`);
    console.log(`Errors: ${totalErrors.toLocaleString()}`);
    console.log(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);

    if (hasErrors) {
      console.log('\n❌ Migration completed with errors. Check logs above.');
      process.exit(1);
    }

    if (argv.dropOld && !argv.dryRun && !hasErrors) {
      console.log('\n🗑️  Dropping old collections...');

      // Define old collections to drop per step
      const collectionsToDrop = [
        'communityusers', 'users', // users step
        'communityposts', 'communitycomments', 'communityvotes', // posts step
        'useranalytics', 'systemmetrics', 'dashboardanalytics', 'searchanalytics', // analytics step
        'carelogs', 'plantcareanalytics', 'reminders', // plant_logs step
        'blogposts', 'blogtags', 'blogcategories', 'blogseries', // blogs step
        'notifications', 'notificationpreferences', // notifications step
        'contactmessages', // messages step
        'communityreports', 'bugreports', // reports step
        'plants', // plants step
        'exportimportoperations' // systemlogs step
      ];

      await runner.dropCollections(collectionsToDrop);
      console.log('✅ Old collections dropped successfully');
    }

    console.log('\n✅ Migration completed successfully!');

  } finally {
    await runner.disconnect();
  }
}

main().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});