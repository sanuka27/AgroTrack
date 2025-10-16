import { MigrationRunner, BatchResult } from '../runner';
import { mapLegacyUser } from '../config/mapping';
import { User } from '../../../src/models/new/users';

export async function usersStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  // First migrate communityusers
  const communityResult = await runner.runStep(
    'usersStep_communityusers',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const user of batch) {
        try {
          const mappedUser = mapLegacyUser(user, 'communityusers');

          if (!isDryRun) {
            await User.create(mappedUser);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process communityuser ${user._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'communityusers',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );

  // Then migrate regular users
  const usersResult = await runner.runStep(
    'usersStep_users',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const user of batch) {
        try {
          const mappedUser = mapLegacyUser(user, 'users');

          if (!isDryRun) {
            await User.create(mappedUser);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process user ${user._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'users',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );

  // Return combined result
  return {
    step: 'usersStep',
    sourceCount: communityResult.sourceCount + usersResult.sourceCount,
    insertedCount: communityResult.insertedCount + usersResult.insertedCount,
    skippedDuplicates: communityResult.skippedDuplicates + usersResult.skippedDuplicates,
    errors: communityResult.errors + usersResult.errors,
    duration: communityResult.duration + usersResult.duration,
    status: (communityResult.status === 'success' && usersResult.status === 'success') ? 'success' : 'failed'
  };
}

export default usersStep;