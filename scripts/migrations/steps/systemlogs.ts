import { MigrationRunner, BatchResult } from '../runner';
import { mapExportImportOperation } from '../config/mapping';
import { SystemLog } from '../../../src/models/new/systemlogs';

export async function systemlogsStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  return await runner.runStep(
    'systemlogsStep',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const operation of batch) {
        try {
          const mappedLog = mapExportImportOperation(operation);

          if (!isDryRun) {
            await SystemLog.create(mappedLog);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process exportimportoperation ${operation._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'exportimportoperations',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );
}