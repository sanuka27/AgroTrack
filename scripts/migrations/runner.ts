import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';

export interface MigrationCheckpoint {
  _id: string; // step name
  lastProcessedId: string | null;
  processedCount: number;
  totalCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface MigrationResult {
  step: string;
  sourceCount: number;
  insertedCount: number;
  skippedDuplicates: number;
  errors: number;
  duration: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface BatchResult {
  inserted?: boolean;
  duplicate?: boolean;
  error?: boolean;
}

export class MigrationRunner {
  private client: MongoClient;
  private db: Db;
  private checkpoints: Map<string, MigrationCheckpoint> = new Map();

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db();
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log('Connected to MongoDB for migration');
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  async loadCheckpoints(): Promise<void> {
    const checkpoints = await this.db.collection('_migrations').find({}).toArray();
    this.checkpoints.clear();
    checkpoints.forEach((cp: any) => {
      this.checkpoints.set(cp._id, cp as MigrationCheckpoint);
    });
  }

  async saveCheckpoint(step: string, checkpoint: Partial<MigrationCheckpoint>): Promise<void> {
    const existing = this.checkpoints.get(step) || {
      _id: step,
      lastProcessedId: null,
      processedCount: 0,
      totalCount: 0,
      status: 'pending',
      startedAt: new Date()
    };

    const updated = { ...existing, ...checkpoint };
    this.checkpoints.set(step, updated);

    await this.db.collection('_migrations').replaceOne(
      { _id: step } as any,
      updated,
      { upsert: true }
    );
  }

  getCheckpoint(step: string): MigrationCheckpoint | undefined {
    return this.checkpoints.get(step);
  }

  async runStep(
    stepName: string,
    processor: (batch: any[], isDryRun: boolean) => Promise<BatchResult[]>,
    options: {
      sourceCollection: string;
      batchSize?: number;
      isDryRun?: boolean;
      resume?: boolean;
    }
  ): Promise<MigrationResult> {
    const { sourceCollection, batchSize = 500, isDryRun = false, resume = false } = options;

    console.log(`\n=== Starting step: ${stepName} ===`);
    console.log(`Source: ${sourceCollection}, Batch size: ${batchSize}, Dry run: ${isDryRun}`);

    const startTime = Date.now();
    let checkpoint = this.getCheckpoint(stepName);

    if (!checkpoint || !resume) {
      checkpoint = {
        _id: stepName,
        lastProcessedId: null,
        processedCount: 0,
        totalCount: 0,
        status: 'running',
        startedAt: new Date()
      };
    } else if (checkpoint.status === 'completed') {
      console.log(`Step ${stepName} already completed, skipping`);
      return {
        step: stepName,
        sourceCount: checkpoint.totalCount,
        insertedCount: checkpoint.processedCount,
        skippedDuplicates: 0,
        errors: 0,
        duration: 0,
        status: 'success'
      };
    }

    await this.saveCheckpoint(stepName, checkpoint);

    try {
      const collection = this.db.collection(sourceCollection);
      const totalCount = await collection.countDocuments();
      console.log(`Total documents in ${sourceCollection}: ${totalCount}`);

      let processedCount = checkpoint.processedCount;
      let insertedCount = 0;
      let skippedDuplicates = 0;
      let errors = 0;

      const query: any = checkpoint.lastProcessedId
        ? { _id: { $gt: new mongoose.Types.ObjectId(checkpoint.lastProcessedId) } }
        : {};

      const cursor = collection.find(query).sort({ _id: 1 });

      while (true) {
        const batch = await cursor.limit(batchSize).toArray();
        if (batch.length === 0) break;

        console.log(`Processing batch of ${batch.length} documents...`);

        try {
          const results = await processor(batch, isDryRun);

          if (!isDryRun) {
            // Process results and collect stats
            for (const result of results) {
              if (result.inserted) insertedCount++;
              else if (result.duplicate) skippedDuplicates++;
              else if (result.error) errors++;
            }
          }

          processedCount += batch.length;
          const lastId = batch[batch.length - 1]._id.toString();

          await this.saveCheckpoint(stepName, {
            lastProcessedId: lastId,
            processedCount,
            totalCount
          });

        } catch (error) {
          console.error(`Error processing batch:`, error);
          errors += batch.length;
          await this.saveCheckpoint(stepName, {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      }

      const duration = Date.now() - startTime;
      const result: MigrationResult = {
        step: stepName,
        sourceCount: totalCount,
        insertedCount,
        skippedDuplicates,
        errors,
        duration,
        status: errors > 0 ? 'failed' : 'success'
      };

      await this.saveCheckpoint(stepName, {
        status: 'completed',
        completedAt: new Date()
      });

      console.log(`Step ${stepName} completed in ${duration}ms`);
      console.table([result]);

      return result;

    } catch (error) {
      console.error(`Step ${stepName} failed:`, error);
      await this.saveCheckpoint(stepName, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date()
      });
      throw error;
    }
  }

  async verifyStep(
    stepName: string,
    targetCollection: string,
    expectedCount?: number
  ): Promise<{ isValid: boolean; mismatches: string[] }> {
    const collection = this.db.collection(targetCollection);
    const actualCount = await collection.countDocuments({ source: stepName.replace('Step', '').toLowerCase() });

    const mismatches: string[] = [];

    if (expectedCount !== undefined && actualCount !== expectedCount) {
      mismatches.push(`Count mismatch: expected ${expectedCount}, got ${actualCount}`);
    }

    // Additional verification logic can be added here
    // e.g., sample document validation

    return {
      isValid: mismatches.length === 0,
      mismatches
    };
  }

  async dropCollections(collections: string[]): Promise<void> {
    for (const collection of collections) {
      try {
        await this.db.collection(collection).drop();
        console.log(`Dropped collection: ${collection}`);
      } catch (error) {
        console.warn(`Failed to drop ${collection}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }
}