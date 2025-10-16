import { MigrationRunner, BatchResult } from '../runner';
import { mapPlant } from '../config/mapping';
import { Plant } from '../../../src/models/new/plants';

export async function plantsStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  return await runner.runStep(
    'plantsStep',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const plant of batch) {
        try {
          const mappedPlant = mapPlant(plant);

          if (!isDryRun) {
            await Plant.create(mappedPlant);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process plant ${plant._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'plants',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );
}